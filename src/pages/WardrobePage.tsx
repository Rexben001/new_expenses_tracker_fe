import { addDays, format, formatISO, parseISO } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiCalendar,
  FiCamera,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiGrid,
  FiHeart,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiUploadCloud,
} from "react-icons/fi";
import { FooterNav } from "../components/FooterNav";
import { HeaderComponent } from "../components/HeaderComponent";
import { Modal } from "../components/Modal";
import SwipeShell from "../components/SwipeShell";
import { WardrobeItemCard } from "../components/wardrobe/WardrobeItemCard";
import {
  WardrobeItemFields,
  type WardrobeItemFormValues,
} from "../components/wardrobe/WardrobeItemFields";
import { WardrobeOutfitCanvas } from "../components/wardrobe/WardrobeOutfitCanvas";
import { useItemContext } from "../hooks/useItemContext";
import {
  createWardrobeItem,
  deleteWardrobeItem,
  getErrorMessage,
  getWardrobeItems,
  getWardrobePlan,
  requestWardrobeUploadUrl,
  saveWardrobePlan,
  updateWardrobeItem,
} from "../services/api";
import {
  processWardrobeImage,
  type ProcessedWardrobeImage,
} from "../services/wardrobeImages";
import {
  categoriesCanReplace,
  generateWardrobeWeek,
  regenerateWardrobeDay,
  scoreReplacement,
} from "../services/wardrobeMatching";
import {
  loadOutfitLayout,
  saveOutfitLayout,
  type GarmentTransform,
} from "../services/wardrobeOutfitLayout";
import { uploadWardrobePng } from "../services/wardrobeUpload";
import {
  WARDROBE_CATEGORIES,
  WARDROBE_CATEGORY_LABELS,
  WARDROBE_COLOR_FAMILIES,
  type WardrobeItem,
  type WardrobeCategory,
  type WardrobePlanDay,
  type WardrobeWeekPlan,
} from "../types/wardrobe";

type WardrobeView = "closet" | "week";
type GroupBy = "category" | "color" | "tone";
type SwapTarget = {
  date: string;
  category: WardrobeCategory;
  item?: WardrobeItem;
};

const todayIso = () => formatISO(new Date(), { representation: "date" });

const emptyForm: WardrobeItemFormValues = {
  name: "",
  category: "top",
  colorFamily: "gray",
  colorHex: "#808080",
  colorTone: "dark",
  favorite: false,
};

const controlClass =
  "rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 shadow-sm transition hover:border-stone-300 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800";

function formFromItem(item: WardrobeItem): WardrobeItemFormValues {
  return {
    name: item.name,
    category: item.category,
    colorFamily: item.colorFamily,
    colorHex: item.colorHex,
    colorTone: item.colorTone,
    favorite: item.favorite,
  };
}

function groupWardrobeItems(items: WardrobeItem[], groupBy: GroupBy) {
  if (groupBy === "category") {
    return WARDROBE_CATEGORIES.map((key) => ({
      key,
      label: WARDROBE_CATEGORY_LABELS[key],
      items: items.filter((item) => item.category === key),
    })).filter((group) => group.items.length > 0);
  }
  if (groupBy === "color") {
    return WARDROBE_COLOR_FAMILIES.map((key) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      items: items.filter((item) => item.colorFamily === key),
    })).filter((group) => group.items.length > 0);
  }
  return (["light", "dark"] as const)
    .map((key) => ({
      key,
      label: `${key.charAt(0).toUpperCase() + key.slice(1)} colors`,
      items: items.filter((item) => item.colorTone === key),
    }))
    .filter((group) => group.items.length > 0);
}

export function WardrobePage() {
  const { getSubAccountId } = useItemContext();
  const [view, setView] = useState<WardrobeView>("closet");
  const [groupBy, setGroupBy] = useState<GroupBy>("category");
  const [query, setQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [weekStart, setWeekStart] = useState(todayIso);
  const [plan, setPlan] = useState<WardrobeWeekPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState(false);
  const [error, setError] = useState("");

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState<WardrobeItemFormValues>(emptyForm);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [queuedUploadFiles, setQueuedUploadFiles] = useState<File[]>([]);
  const [processedImage, setProcessedImage] =
    useState<ProcessedWardrobeImage | null>(null);
  const processedPreviewRef = useRef<string | null>(null);
  const [backgroundThreshold, setBackgroundThreshold] = useState(58);
  const categoryManuallySetRef = useRef(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [batchUploadIndex, setBatchUploadIndex] = useState(0);
  const [dialogError, setDialogError] = useState("");

  const [editingItem, setEditingItem] = useState<WardrobeItem | null>(null);
  const [editForm, setEditForm] = useState<WardrobeItemFormValues>(emptyForm);
  const [savingItem, setSavingItem] = useState(false);
  const [swapTarget, setSwapTarget] = useState<SwapTarget | null>(null);
  const [outfitLayout, setOutfitLayout] = useState(loadOutfitLayout);

  const releaseProcessedPreview = useCallback(() => {
    if (processedPreviewRef.current) {
      URL.revokeObjectURL(processedPreviewRef.current);
      processedPreviewRef.current = null;
    }
  }, []);

  useEffect(() => releaseProcessedPreview, [releaseProcessedPreview]);

  useEffect(() => {
    saveOutfitLayout(outfitLayout);
  }, [outfitLayout]);

  const loadWardrobe = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const subId = await getSubAccountId();
      const [nextItems, savedPlan] = await Promise.all([
        getWardrobeItems(subId),
        getWardrobePlan(weekStart, subId),
      ]);
      setItems(nextItems);
      if (savedPlan) {
        setPlan(savedPlan);
      } else {
        const generated = generateWardrobeWeek({
          items: nextItems,
          weekStart,
        });
        setPlan(generated);
        if (generated.days.some((day) => day.itemIds.length > 0)) {
          await saveWardrobePlan(generated, subId);
        }
      }
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Could not load wardrobe."));
    } finally {
      setLoading(false);
    }
  }, [getSubAccountId, weekStart]);

  useEffect(() => {
    void loadWardrobe();
  }, [loadWardrobe]);

  useEffect(() => {
    const refreshSignedImages = async () => {
      try {
        const subId = await getSubAccountId();
        setItems(await getWardrobeItems(subId));
      } catch {
        // Normal page refresh/error handling remains authoritative.
      }
    };
    const timer = window.setInterval(
      () => void refreshSignedImages(),
      12 * 60 * 1000,
    );
    return () => window.clearInterval(timer);
  }, [getSubAccountId]);

  const persistPlan = useCallback(
    async (nextPlan: WardrobeWeekPlan) => {
      const previous = plan;
      setPlan(nextPlan);
      setSavingPlan(true);
      setError("");
      try {
        const subId = await getSubAccountId();
        const response = await saveWardrobePlan(nextPlan, subId);
        setPlan(response.plan);
      } catch (saveError) {
        setPlan(previous);
        setError(getErrorMessage(saveError, "Could not save outfit changes."));
      } finally {
        setSavingPlan(false);
      }
    },
    [getSubAccountId, plan],
  );

  const closeUpload = () => {
    releaseProcessedPreview();
    setUploadOpen(false);
    setUploadFile(null);
    setQueuedUploadFiles([]);
    setProcessedImage(null);
    setUploadForm(emptyForm);
    setBackgroundThreshold(58);
    categoryManuallySetRef.current = false;
    setDialogError("");
    setUploadProgress(null);
    setBatchUploadIndex(0);
  };

  const processFile = async (file: File, threshold: number) => {
    setProcessingImage(true);
    setDialogError("");
    try {
      const result = await processWardrobeImage(file, {
        backgroundThreshold: threshold,
      });
      releaseProcessedPreview();
      processedPreviewRef.current = result.previewUrl;
      setProcessedImage(result);
      setUploadForm((current) => ({
        ...current,
        category: categoryManuallySetRef.current
          ? current.category
          : result.categorySuggestion.category,
        colorFamily: result.colorAnalysis.colorFamily,
        colorHex: result.colorAnalysis.colorHex,
        colorTone: result.colorAnalysis.colorTone,
      }));
    } catch (processError) {
      setDialogError(
        getErrorMessage(processError, "Could not process this image."),
      );
    } finally {
      setProcessingImage(false);
    }
  };

  const chooseUploadFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) {
      setDialogError("Image must be smaller than 12 MB.");
      return;
    }
    setUploadFile(file);
    setUploadForm((current) => ({
      ...current,
      name:
        current.name ||
        file.name.replace(/\.(heic|heif|jpe?g|png|webp)$/i, "") ||
        "Pasted garment",
    }));
    void processFile(file, backgroundThreshold);
  };

  const chooseUploadFiles = (files: File[]) => {
    const validFiles = files.filter((file) => file.size > 0);
    if (!validFiles.length) return;
    const oversized = validFiles.find((file) => file.size > 12 * 1024 * 1024);
    if (oversized) {
      setDialogError(`${oversized.name || "One image"} is larger than 12 MB.`);
      return;
    }
    setQueuedUploadFiles(validFiles.slice(1));
    chooseUploadFile(validFiles[0]);
  };

  useEffect(() => {
    if (!uploadOpen) return;

    const handleImagePaste = (event: ClipboardEvent) => {
      const imageItems = Array.from(event.clipboardData?.items ?? []).filter(
        (item) => item.kind === "file" && item.type.startsWith("image/"),
      );
      if (!imageItems.length) return;

      event.preventDefault();
      const pastedFiles = imageItems.flatMap((item, index) => {
        const pastedBlob = item.getAsFile();
        if (!pastedBlob) return [];
        const extension =
          pastedBlob.type.split("/")[1]?.replace("jpeg", "jpg") || "png";
        return [
          new File(
            [pastedBlob],
            `pasted-garment-${Date.now()}-${index + 1}.${extension}`,
            { type: pastedBlob.type || "image/png" },
          ),
        ];
      });
      chooseUploadFiles(pastedFiles);
    };

    window.addEventListener("paste", handleImagePaste);
    return () => window.removeEventListener("paste", handleImagePaste);
  });

  const submitUpload = async () => {
    if (!uploadFile || !processedImage || !uploadForm.name.trim()) {
      setDialogError("Choose a photo and add a garment name.");
      return;
    }
    setUploading(true);
    setDialogError("");
    setUploadProgress(0);
    setBatchUploadIndex(1);
    let savedCount = 0;
    try {
      const subId = await getSubAccountId();
      const uploadOne = async (
        file: File,
        processed: ProcessedWardrobeImage,
        form: WardrobeItemFormValues,
      ) => {
        const name =
          form.name.trim() ||
          file.name.replace(/\.(heic|heif|jpe?g|png|webp)$/i, "") ||
          "Garment";
        const signedUpload = await requestWardrobeUploadUrl(`${name}.png`, subId);
        await uploadWardrobePng({
          blob: processed.blob,
          uploadUrl: signedUpload.uploadUrl,
          onProgress: setUploadProgress,
        });
        return createWardrobeItem(
          {
            ...form,
            name,
            id: signedUpload.itemId,
            imageKey: signedUpload.imageKey,
          },
          subId,
        );
      };

      const createdItems: WardrobeItem[] = [];
      const firstCreated = await uploadOne(uploadFile, processedImage, uploadForm);
      createdItems.push(firstCreated.item);
      savedCount += 1;

      for (let index = 0; index < queuedUploadFiles.length; index += 1) {
        const file = queuedUploadFiles[index];
        setBatchUploadIndex(index + 2);
        setUploadProgress(0);
        const processed = await processWardrobeImage(file, {
          backgroundThreshold,
        });
        try {
          const detected = processed.colorAnalysis;
          const created = await uploadOne(file, processed, {
            ...uploadForm,
            name: file.name.replace(/\.(heic|heif|jpe?g|png|webp)$/i, ""),
            colorFamily: detected.colorFamily,
            colorHex: detected.colorHex,
            colorTone: detected.colorTone,
          });
          createdItems.push(created.item);
          savedCount += 1;
        } finally {
          URL.revokeObjectURL(processed.previewUrl);
        }
      }
      if (!plan || plan.days.every((day) => day.itemIds.length === 0)) {
        const generated = generateWardrobeWeek({
          currentPlan: plan,
          items: [...createdItems, ...items],
          weekStart,
        });
        if (generated.days.some((day) => day.itemIds.length > 0)) {
          await saveWardrobePlan(generated, subId);
        }
      }
      closeUpload();
      await loadWardrobe();
    } catch (uploadError) {
      if (savedCount > 0) {
        closeUpload();
        await loadWardrobe();
        setError(
          `${savedCount} garment${savedCount === 1 ? " was" : "s were"} saved. Remaining batch failed: ${getErrorMessage(uploadError, "Upload failed.")}`,
        );
      } else {
        setDialogError(getErrorMessage(uploadError, "Could not save garment."));
      }
    } finally {
      setUploading(false);
    }
  };

  const openEdit = (item: WardrobeItem) => {
    setEditingItem(item);
    setEditForm(formFromItem(item));
    setDialogError("");
  };

  const submitEdit = async () => {
    if (!editingItem || !editForm.name.trim()) return;
    setSavingItem(true);
    setDialogError("");
    try {
      const subId = await getSubAccountId();
      const response = await updateWardrobeItem(
        editingItem.id,
        { ...editForm, name: editForm.name.trim() },
        subId,
      );
      setItems((current) =>
        current.map((item) =>
          item.id === response.item.id ? response.item : item,
        ),
      );
      setEditingItem(null);
    } catch (saveError) {
      setDialogError(getErrorMessage(saveError, "Could not update garment."));
    } finally {
      setSavingItem(false);
    }
  };

  const toggleGarmentFavorite = async (item: WardrobeItem) => {
    setError("");
    try {
      const subId = await getSubAccountId();
      const response = await updateWardrobeItem(
        item.id,
        { favorite: !item.favorite },
        subId,
      );
      setItems((current) =>
        current.map((currentItem) =>
          currentItem.id === item.id ? response.item : currentItem,
        ),
      );
    } catch (favoriteError) {
      setError(getErrorMessage(favoriteError, "Could not update favorite."));
    }
  };

  const removeGarment = async (item: WardrobeItem) => {
    const confirmed = window.confirm(
      `Delete ${item.name} from your wardrobe? This also removes its saved photo.`,
    );
    if (!confirmed) return;
    setError("");
    try {
      const subId = await getSubAccountId();
      await deleteWardrobeItem(item.id, subId);
      setItems((current) => current.filter(({ id }) => id !== item.id));
      if (plan) {
        await persistPlan({
          ...plan,
          days: plan.days.map((day) => ({
            ...day,
            itemIds: day.itemIds.filter((id) => id !== item.id),
            lockedItemIds: day.lockedItemIds.filter((id) => id !== item.id),
          })),
        });
      }
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Could not delete garment."));
    }
  };

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      if (favoritesOnly && !item.favorite) return false;
      if (!normalizedQuery) return true;
      return [item.name, item.category, item.colorFamily, item.colorTone].some(
        (value) => value.toLowerCase().includes(normalizedQuery),
      );
    });
  }, [favoritesOnly, items, query]);
  const groupedItems = useMemo(
    () => groupWardrobeItems(filteredItems, groupBy),
    [filteredItems, groupBy],
  );
  const itemById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );

  const updatePlanDay = (date: string, update: (day: WardrobePlanDay) => WardrobePlanDay) => {
    if (!plan || savingPlan) return false;
    void persistPlan({
      ...plan,
      days: plan.days.map((day) => (day.date === date ? update(day) : day)),
    });
    return true;
  };

  const regenerateWeek = () => {
    if (!plan || savingPlan) return;
    void persistPlan(
      generateWardrobeWeek({ currentPlan: plan, items, weekStart }),
    );
  };

  const regenerateDay = (date: string) => {
    if (!plan || savingPlan) return;
    void persistPlan(regenerateWardrobeDay({ date, items, plan }));
  };

  const replacementCandidates = useMemo(() => {
    if (!swapTarget || !plan) return [];
    const day = plan.days.find(({ date }) => date === swapTarget.date);
    if (!day) return [];
    const otherItems = day.itemIds
      .filter((id) => id !== swapTarget.item?.id)
      .map((id) => itemById.get(id))
      .filter((item): item is WardrobeItem => Boolean(item));
    return items
      .filter(
        (item) =>
          item.id !== swapTarget.item?.id &&
          !day.itemIds.includes(item.id) &&
          categoriesCanReplace(swapTarget.category, item.category),
      )
      .map((item) => ({ item, score: scoreReplacement(item, otherItems) }))
      .sort((left, right) => right.score - left.score);
  }, [itemById, items, plan, swapTarget]);

  const selectReplacement = (replacement: WardrobeItem) => {
    if (!swapTarget) return;
    const started = updatePlanDay(swapTarget.date, (day) => ({
      ...day,
      itemIds: swapTarget.item
        ? day.itemIds.map((id) =>
            id === swapTarget.item?.id ? replacement.id : id,
          )
        : [...day.itemIds, replacement.id],
      lockedItemIds: swapTarget.item
        ? day.lockedItemIds.map((id) =>
            id === swapTarget.item?.id ? replacement.id : id,
          )
        : day.lockedItemIds,
    }));
    if (started) setSwapTarget(null);
  };

  const openJacketUpload = () => {
    setSwapTarget(null);
    setUploadForm({ ...emptyForm, category: "blazer-jacket" });
    categoryManuallySetRef.current = true;
    setUploadOpen(true);
  };

  const updateGarmentTransform = (
    item: WardrobeItem,
    transform: GarmentTransform,
  ) => {
    setOutfitLayout((current) => ({
      ...current,
      garmentTransforms: {
        ...current.garmentTransforms,
        [item.id]: transform,
      },
    }));
  };

  const weekEnd = format(addDays(parseISO(weekStart), 6), "MMM d");
  const categoryCount = new Set(items.map((item) => item.category)).size;

  return (
    <SwipeShell
      refresh={loadWardrobe}
      disabled={uploadOpen || Boolean(editingItem) || Boolean(swapTarget)}
    >
      <HeaderComponent
        title="Closet Match"
        className="sm:max-w-3xl lg:max-w-7xl"
      >
        <div className="flex items-center justify-between gap-3 pb-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-rose-600 dark:text-rose-300">
              Closet Match
            </p>
            <h1 className="truncate text-xl font-black tracking-tight text-stone-950 dark:text-white">
              Style what you own
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="flex shrink-0 items-center gap-2 rounded-full bg-stone-950 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 dark:bg-white dark:text-gray-950"
          >
            <FiPlus /> Add garment
          </button>
        </div>
      </HeaderComponent>

      <main className="mx-auto min-h-screen max-w-7xl px-4 pb-32 pt-[calc(var(--app-header-height,6rem)+1.5rem)] text-stone-900 dark:text-gray-50 sm:px-6">
        <div className="mb-6 flex justify-center">
          <div className="grid w-full max-w-md grid-cols-2 rounded-2xl bg-stone-200/60 p-1 dark:bg-gray-800">
            <button
              type="button"
              onClick={() => setView("closet")}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                view === "closet"
                  ? "bg-white text-stone-950 shadow-sm dark:bg-gray-700 dark:text-white"
                  : "text-stone-500 dark:text-gray-400"
              }`}
            >
              <FiGrid /> My wardrobe
            </button>
            <button
              type="button"
              onClick={() => setView("week")}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                view === "week"
                  ? "bg-white text-stone-950 shadow-sm dark:bg-gray-700 dark:text-white"
                  : "text-stone-500 dark:text-gray-400"
              }`}
            >
              <FiCalendar /> My week
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid min-h-72 place-items-center rounded-3xl border border-stone-200 bg-white/60 dark:border-gray-800 dark:bg-gray-900/60">
            <div className="text-center">
              <FiRefreshCw className="mx-auto h-7 w-7 animate-spin text-rose-500" />
              <p className="mt-3 text-sm font-semibold text-stone-500 dark:text-gray-400">
                Opening your wardrobe…
              </p>
            </div>
          </div>
        ) : view === "closet" ? (
          <>
            <section className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto]">
              <div className="relative">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search name, color, or category"
                  className="w-full rounded-2xl border border-stone-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200 dark:border-gray-700 dark:bg-gray-900 dark:focus:ring-gray-800"
                />
              </div>
              <button
                type="button"
                onClick={() => setFavoritesOnly((value) => !value)}
                className={`${controlClass} flex items-center justify-center gap-2 ${
                  favoritesOnly ? "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-950/40" : ""
                }`}
                aria-pressed={favoritesOnly}
              >
                <FiHeart className={favoritesOnly ? "fill-current" : ""} /> Favorites
              </button>
            </section>

            <section className="mb-8 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-2xl font-black tracking-tight">{items.length} pieces</p>
                <p className="text-xs font-medium text-stone-500 dark:text-gray-400">
                  {categoryCount} of {WARDROBE_CATEGORIES.length} categories
                </p>
              </div>
              <div className="flex flex-wrap gap-2" aria-label="Group wardrobe by">
                {(
                  [
                    ["category", "Category"],
                    ["color", "Color"],
                    ["tone", "Light / dark"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setGroupBy(value)}
                    className={`${controlClass} ${
                      groupBy === value
                        ? "border-stone-950 bg-stone-950 text-white hover:bg-stone-900 dark:border-white dark:bg-white dark:text-gray-950"
                        : ""
                    }`}
                    aria-pressed={groupBy === value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

            {groupedItems.length > 0 ? (
              <div className="space-y-10">
                {groupedItems.map((group) => (
                  <section key={group.key}>
                    <div className="mb-4 flex items-end gap-3 border-b border-stone-200 pb-2 dark:border-gray-800">
                      <h2 className="text-lg font-black">{group.label}</h2>
                      <span className="pb-0.5 text-xs font-bold text-stone-400">
                        {group.items.length}
                      </span>
                    </div>
                    <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 xl:columns-5">
                      {group.items.map((item) => (
                        <WardrobeItemCard
                          key={item.id}
                          item={item}
                          onEdit={openEdit}
                          onDelete={(selected) => void removeGarment(selected)}
                          onToggleFavorite={(selected) =>
                            void toggleGarmentFavorite(selected)
                          }
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <section className="grid min-h-80 place-items-center rounded-[2rem] border border-dashed border-stone-300 bg-white/55 p-8 text-center dark:border-gray-700 dark:bg-gray-900/55">
                <div className="max-w-sm">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-200">
                    <FiCamera className="h-7 w-7" />
                  </div>
                  <h2 className="mt-4 text-xl font-black">
                    {items.length ? "No pieces found" : "Your digital wardrobe starts here"}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-stone-500 dark:text-gray-400">
                    {items.length
                      ? "Change search or favorite filter."
                      : "Photograph one garment against a plain, contrasting background. We remove the background and sort its color without AI."}
                  </p>
                  {!items.length && (
                    <button
                      type="button"
                      onClick={() => setUploadOpen(true)}
                      className="mt-5 inline-flex items-center gap-2 rounded-full bg-stone-950 px-5 py-3 text-sm font-bold text-white dark:bg-white dark:text-gray-950"
                    >
                      <FiPlus /> Add first garment
                    </button>
                  )}
                </div>
              </section>
            )}
          </>
        ) : (
          <section>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-rose-600 dark:text-rose-300">
                  Seven-day edit
                </p>
                <h2 className="text-2xl font-black tracking-tight">
                  {format(parseISO(weekStart), "MMM d")} – {weekEnd}
                </h2>
                <p className="text-xs text-stone-500 dark:text-gray-400">
                  Favorites and locked pieces stay during regeneration.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setWeekStart(
                      formatISO(addDays(parseISO(weekStart), -7), {
                        representation: "date",
                      }),
                    )
                  }
                  disabled={savingPlan}
                  className={controlClass}
                  aria-label="Previous seven days"
                >
                  <FiChevronLeft />
                </button>
                <button
                  type="button"
                  onClick={() => setWeekStart(todayIso())}
                  disabled={savingPlan}
                  className={controlClass}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setWeekStart(
                      formatISO(addDays(parseISO(weekStart), 7), {
                        representation: "date",
                      }),
                    )
                  }
                  disabled={savingPlan}
                  className={controlClass}
                  aria-label="Next seven days"
                >
                  <FiChevronRight />
                </button>
                <button
                  type="button"
                  onClick={regenerateWeek}
                  disabled={savingPlan || items.length === 0}
                  className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiRefreshCw className={savingPlan ? "animate-spin" : ""} />
                  Remix week
                </button>
              </div>
            </div>

            <div className="mb-5 rounded-2xl border border-stone-200 bg-white/70 px-4 py-3 text-xs text-stone-500 shadow-sm dark:border-gray-800 dark:bg-gray-900/70 dark:text-gray-400">
              Clothes are shown as a flat lay. Use the move button beside a garment to fine-tune its position, size, and tilt.
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {(plan?.days ?? []).map((day) => {
                const dayItems = day.itemIds
                  .map((id) => itemById.get(id))
                  .filter((item): item is WardrobeItem => Boolean(item));
                const canAddJacket =
                  !dayItems.some(
                    (item) =>
                      item.category === "dress" ||
                      item.category === "blazer-jacket",
                  ) &&
                  dayItems.some(
                    (item) => item.category === "top" || item.category === "shirt",
                  ) &&
                  dayItems.some(
                    (item) => item.category === "trousers" || item.category === "skirt",
                  );
                return (
                  <article
                    key={day.date}
                    className="rounded-[1.75rem] border border-stone-200 bg-white p-3.5 shadow-[0_12px_36px_rgba(54,41,31,0.08)] dark:border-gray-800 dark:bg-gray-900"
                  >
                    <div className="mb-3 flex items-center justify-between px-1">
                      <div>
                        <h3 className="font-black">
                          {format(parseISO(day.date), "EEEE")}
                        </h3>
                        <p className="text-xs font-medium text-stone-400">
                          {format(parseISO(day.date), "MMMM d")}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={savingPlan}
                        onClick={() =>
                          updatePlanDay(day.date, (current) => ({
                            ...current,
                            favorite: !current.favorite,
                          }))
                        }
                        className={`grid h-10 w-10 place-items-center rounded-full transition ${
                          day.favorite
                            ? "bg-rose-50 text-rose-600 dark:bg-rose-950/50"
                            : "text-stone-400 hover:bg-stone-100 dark:hover:bg-gray-800"
                        }`}
                        aria-label={
                          day.favorite ? "Unfavorite outfit" : "Favorite outfit"
                        }
                      >
                        <FiHeart className={day.favorite ? "fill-current" : ""} />
                      </button>
                    </div>
                    <WardrobeOutfitCanvas
                      disabled={savingPlan}
                      garmentTransforms={outfitLayout.garmentTransforms}
                      items={dayItems}
                      editing
                      lockedItemIds={day.lockedItemIds}
                      onSelectItem={(item) =>
                        setSwapTarget({
                          date: day.date,
                          category: item.category,
                          item,
                        })
                      }
                      onAddJacket={
                        canAddJacket
                          ? () =>
                              setSwapTarget({
                                date: day.date,
                                category: "blazer-jacket",
                              })
                          : undefined
                      }
                      onRegenerate={() => regenerateDay(day.date)}
                      onTransformChange={updateGarmentTransform}
                      onToggleLock={(item) =>
                        updatePlanDay(day.date, (current) => ({
                          ...current,
                          lockedItemIds: current.lockedItemIds.includes(item.id)
                            ? current.lockedItemIds.filter((id) => id !== item.id)
                            : [...current.lockedItemIds, item.id],
                        }))
                      }
                      onRemove={(item) =>
                        updatePlanDay(day.date, (current) => ({
                          ...current,
                          itemIds: current.itemIds.filter((id) => id !== item.id),
                          lockedItemIds: current.lockedItemIds.filter(
                            (id) => id !== item.id,
                          ),
                        }))
                      }
                    />
                  </article>
                );
              })}
            </div>

            {items.length > 0 &&
              (plan?.days ?? []).every((day) => day.itemIds.length === 0) && (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                  Add one dress, or add both an upper piece and a bottom piece, to create complete outfits.
                </div>
              )}
          </section>
        )}
      </main>

      <FooterNav className="sm:max-w-3xl lg:max-w-7xl" />

      <Modal
        open={uploadOpen}
        onClose={uploading ? () => undefined : closeUpload}
        title="Add one garment"
      >
        <div className="max-h-[75vh] space-y-4 overflow-y-auto pr-1">
          {!processedImage ? (
            <label className="grid min-h-48 cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 p-6 text-center transition hover:border-rose-300 hover:bg-rose-50/40 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-rose-800">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                className="sr-only"
                disabled={processingImage}
                onChange={(event) =>
                  chooseUploadFiles(Array.from(event.target.files ?? []))
                }
              />
              <div>
                {processingImage ? (
                  <FiRefreshCw className="mx-auto h-8 w-8 animate-spin text-rose-500" />
                ) : (
                  <FiUploadCloud className="mx-auto h-9 w-9 text-rose-500" />
                )}
                <p className="mt-3 text-sm font-bold">
                  {processingImage ? "Removing background…" : "Choose garment photos"}
                </p>
                <p className="mt-1 text-xs leading-5 text-stone-500 dark:text-gray-400">
                  Choose a file, use camera, or paste with Ctrl/Cmd+V. One centered garment on a plain background. Up to 12 MB.
                </p>
              </div>
            </label>
          ) : (
            <div className="grid grid-cols-[7rem_1fr] gap-4 rounded-2xl bg-stone-100 p-3 dark:bg-gray-800">
              <div className="grid h-36 place-items-center overflow-hidden rounded-xl bg-white dark:bg-gray-900">
                <img
                  src={processedImage.previewUrl}
                  alt="Garment with background removed"
                  className="h-full w-full object-contain p-2"
                />
              </div>
              <div className="min-w-0 self-center">
                <p className="truncate text-sm font-bold">{uploadFile?.name}</p>
                {queuedUploadFiles.length > 0 && (
                  <p className="mt-1 text-xs font-bold text-rose-600 dark:text-rose-300">
                    + {queuedUploadFiles.length} more garment{queuedUploadFiles.length === 1 ? "" : "s"}
                  </p>
                )}
                <p className="mt-1 text-xs text-stone-500 dark:text-gray-400">
                  {processedImage.width} × {processedImage.height}px PNG
                </p>
                <p className="mt-1 text-[11px] font-medium text-stone-500 dark:text-gray-400">
                  Shape suggests {WARDROBE_CATEGORY_LABELS[processedImage.categorySuggestion.category].toLowerCase()} ({Math.round(processedImage.categorySuggestion.confidence * 100)}%). Confirm below.
                </p>
                <label className="mt-3 block text-[10px] font-bold uppercase tracking-wide text-stone-500">
                  Background removal {backgroundThreshold}
                  <input
                    type="range"
                    min="20"
                    max="110"
                    value={backgroundThreshold}
                    onChange={(event) =>
                      setBackgroundThreshold(Number(event.target.value))
                    }
                    className="mt-1 w-full accent-rose-600"
                  />
                </label>
                <button
                  type="button"
                  disabled={processingImage || !uploadFile}
                  onClick={() =>
                    uploadFile && void processFile(uploadFile, backgroundThreshold)
                  }
                  className="mt-1 text-xs font-bold text-rose-600 hover:text-rose-700 disabled:opacity-50"
                >
                  {processingImage ? "Processing…" : "Apply again"}
                </button>
              </div>
            </div>
          )}

          {dialogError && (
            <p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
              {dialogError}
            </p>
          )}

          {processedImage && (
            <>
              <WardrobeItemFields
                values={uploadForm}
                onChange={(next) => {
                  if (next.category !== uploadForm.category) {
                    categoryManuallySetRef.current = true;
                  }
                  setUploadForm(next);
                }}
              />
              {queuedUploadFiles.length > 0 && (
                <p className="rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
                  Category applies to all {queuedUploadFiles.length + 1} garments. Each extra garment uses its filename and separately detected color.
                </p>
              )}

              {uploading && (
                <div>
                  <div className="h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-gray-700">
                    <div
                      className="h-full rounded-full bg-rose-600 transition-[width]"
                      style={{
                        width: `${Math.round((uploadProgress ?? 0.12) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-center text-xs font-medium text-stone-500">
                    Saving {batchUploadIndex} of {queuedUploadFiles.length + 1} securely to S3…
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={() => void submitUpload()}
                disabled={uploading || processingImage || !uploadForm.name.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-950"
              >
                {uploading ? <FiRefreshCw className="animate-spin" /> : <FiCheck />}
                {uploading ? "Saving garment" : "Add to wardrobe"}
              </button>
            </>
          )}
        </div>
      </Modal>

      <Modal
        open={Boolean(editingItem)}
        onClose={() => {
          setEditingItem(null);
          setDialogError("");
        }}
        title="Edit garment"
      >
        <div className="max-h-[75vh] space-y-4 overflow-y-auto pr-1">
          {editingItem && (
            <div className="relative isolate h-36 min-h-0 overflow-hidden rounded-2xl bg-stone-100 dark:bg-gray-800">
              <img
                src={editingItem.imageUrl}
                alt={editingItem.name}
                className="pointer-events-none absolute inset-0 block h-full max-h-full w-full max-w-full object-contain p-3"
              />
            </div>
          )}
          <WardrobeItemFields
            values={editForm}
            onChange={setEditForm}
            showFavorite
          />
          {dialogError && (
            <p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
              {dialogError}
            </p>
          )}
          <button
            type="button"
            onClick={() => void submitEdit()}
            disabled={savingItem || !editForm.name.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-50 dark:bg-white dark:text-gray-950"
          >
            {savingItem ? <FiRefreshCw className="animate-spin" /> : <FiCheck />}
            Save changes
          </button>
        </div>
      </Modal>

      <Modal
        open={Boolean(swapTarget)}
        onClose={() => setSwapTarget(null)}
        title={
          swapTarget?.item
            ? `Swap ${swapTarget.item.name}`
            : "Add jacket or blazer"
        }
      >
        <div className="max-h-[65vh] space-y-2 overflow-y-auto pr-1">
          {replacementCandidates.length > 0 ? (
            replacementCandidates.map(({ item, score }) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectReplacement(item)}
                className="flex w-full items-center gap-3 rounded-2xl border border-stone-200 p-2 text-left transition hover:border-rose-300 hover:bg-rose-50/40 dark:border-gray-700 dark:hover:border-rose-800 dark:hover:bg-rose-950/20"
              >
                <span className="relative isolate block h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-100 dark:bg-gray-800">
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="pointer-events-none absolute inset-0 block h-full max-h-full w-full max-w-full object-contain p-1.5"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{item.name}</span>
                  <span className="mt-1 block text-xs capitalize text-stone-500 dark:text-gray-400">
                    {item.colorTone} {item.colorFamily} · match {Math.round(score * 20)}%
                  </span>
                </span>
                <FiChevronRight className="shrink-0 text-stone-400" />
              </button>
            ))
          ) : swapTarget?.item ? (
            <p className="rounded-2xl bg-stone-50 p-5 text-center text-sm text-stone-500 dark:bg-gray-800 dark:text-gray-300">
              No other pieces fit this outfit slot yet.
            </p>
          ) : (
            <div className="rounded-2xl bg-stone-50 p-5 text-center dark:bg-gray-800">
              <p className="text-sm text-stone-500 dark:text-gray-300">
                No jackets or blazers are in your wardrobe yet.
              </p>
              <button
                type="button"
                onClick={openJacketUpload}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-stone-950 px-4 py-2.5 text-sm font-bold text-white dark:bg-white dark:text-gray-950"
              >
                <FiPlus /> Add jacket to wardrobe
              </button>
            </div>
          )}
        </div>
      </Modal>
    </SwipeShell>
  );
}
