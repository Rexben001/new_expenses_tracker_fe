import { useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiClock,
  FiMapPin,
  FiPackage,
  FiPieChart,
  FiPlus,
  FiSearch,
  FiShoppingCart,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { FaSnowflake } from "react-icons/fa";
import { Link } from "react-router-dom";
import { FoodItemCard } from "../components/FoodItemCard";
import { FoodQuickAdd } from "../components/FoodQuickAdd";
import { FooterNav } from "../components/FooterNav";
import { HeaderComponent } from "../components/HeaderComponent";
import SwipeShell from "../components/SwipeShell";
import { useItemContext } from "../hooks/useItemContext";
import {
  createFoodItem,
  deleteFoodItem,
  getErrorMessage,
  updateFoodItem,
} from "../services/api";
import {
  daysUntilExpiry,
  getFoodStatus,
  isFreshnessFlagged,
  needsRestock,
} from "../services/foodInventory";
import {
  findFoodPredictions,
  FOOD_LOCATIONS,
  FOOD_UNITS,
  hasDefaultFoodExpiry,
  predictionToFoodInput,
  standardizeFoodLocation,
  toDateInputAfterDays,
  type FoodPrediction,
} from "../services/foodPredictions";
import type {
  FoodCategory,
  FoodItem,
  FoodItemInput,
  FoodLifecycleStatus,
} from "../types/food";

type Filter = "all" | "restock" | "tonight" | "expiring";
type Outcome = Exclude<FoodLifecycleStatus, "active">;
type NewFoodOption = {
  field: "location" | "unit" | "category";
  value: string;
};

const ADD_NEW_FOOD_OPTION = "__add_new_food_option__";

const emptyForm: FoodItemInput = {
  name: "",
  category: "food",
  quantity: 1,
  unit: "packs",
  minimumQuantity: 1,
  expiryDate: "",
  boughtDate: "",
  cookedDate: "",
  location: "Pantry",
  notes: "",
  buy: false,
  opened: false,
  freezable: false,
};

const categories: Array<{ value: FoodCategory; label: string }> = [
  { value: "food", label: "Food" },
  { value: "fruit", label: "Fruit" },
  { value: "vegetable", label: "Vegetable" },
  { value: "drink", label: "Drink" },
  { value: "spice", label: "Spice" },
  { value: "ingredient", label: "Ingredient" },
  { value: "soup", label: "Soup" },
  { value: "cooked", label: "Cooked food" },
  { value: "other", label: "Other" },
];

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white p-3 text-base outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-900";

function isDueWithin(item: FoodItem, days: number) {
  if (!item.expiryDate) return false;
  const remaining = daysUntilExpiry(item.expiryDate);
  return remaining >= 0 && remaining <= days;
}

export function FoodTrackerPage() {
  const {
    foodItems: items,
    setFoodItems: setItems,
    fetchFoodItems,
    getSubAccountId,
    resourceErrors,
    resourceLoading,
  } = useItemContext();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [form, setForm] = useState<FoodItemInput>(emptyForm);
  const [editingId, setEditingId] = useState<string>();
  const [formOpen, setFormOpen] = useState(false);
  const [mutationError, setMutationError] = useState("");
  const [pendingId, setPendingId] = useState<string>();
  const [newFoodOption, setNewFoodOption] = useState<NewFoodOption>();

  const restockCount = items.filter(needsRestock).length;
  const tonightCount = items.filter(
    (item) => isDueWithin(item, 2) || isFreshnessFlagged(item)
  ).length;
  const expiringCount = items.filter((item) => {
    const status = getFoodStatus(item);
    return status === "expiring" || status === "expired" || status === "stale";
  }).length;
  const locations = useMemo(
    () => [
      "All",
      ...Array.from(new Set(items.map((item) => item.location || "Unassigned"))).sort(),
    ],
    [items]
  );

  const shownItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items
      .filter((item) => {
        if (selectedLocation !== "All" && (item.location || "Unassigned") !== selectedLocation) return false;
        if (filter === "restock" && !needsRestock(item)) return false;
        if (
          filter === "tonight" &&
          !isDueWithin(item, 2) &&
          !isFreshnessFlagged(item)
        ) return false;
        if (
          filter === "expiring" &&
          !["expiring", "expired", "stale"].includes(getFoodStatus(item))
        ) return false;
        if (!normalizedQuery) return true;
        return [item.name, item.category, item.location, item.notes]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery));
      })
      .sort((a, b) => {
        const priority = {
          expired: 0,
          stale: 1,
          out: 2,
          expiring: 3,
          low: 4,
          available: 5,
        };
        return (
          priority[getFoodStatus(a)] - priority[getFoodStatus(b)] ||
          a.name.localeCompare(b.name)
        );
      });
  }, [filter, items, query, selectedLocation]);

  const locationGroups = useMemo(() => {
    const groups = new Map<string, FoodItem[]>();
    shownItems.forEach((item) => {
      const location = item.location || "Unassigned";
      groups.set(location, [...(groups.get(location) ?? []), item]);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [shownItems]);

  const freezeCandidates = useMemo(
    () =>
      items.filter(
        (item) =>
          item.freezable &&
          (item.estimatedValue ?? 0) >= 5 &&
          isDueWithin(item, 1) &&
          item.location?.toLowerCase() !== "freezer"
      ),
    [items]
  );
  const formPredictions = useMemo(
    () => findFoodPredictions(form.name, 4),
    [form.name]
  );
  const locationOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...FOOD_LOCATIONS,
          ...items.map((item) => item.location).filter(Boolean),
          ...(form.location ? [form.location] : []),
        ] as string[])
      ).sort((a, b) => a.localeCompare(b)),
    [form.location, items]
  );
  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...categories.map((category) => category.value),
          ...items.map((item) => item.category).filter(Boolean),
          form.category,
        ])
      ).sort((a, b) => a.localeCompare(b)),
    [form.category, items]
  );
  const unitOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...FOOD_UNITS,
          ...items.map((item) => item.unit).filter(Boolean),
          form.unit,
        ] as string[])
      ).sort((a, b) => a.localeCompare(b)),
    [form.unit, items]
  );

  const openNew = () => {
    setEditingId(undefined);
    setForm({ ...emptyForm });
    setNewFoodOption(undefined);
    setMutationError("");
    setFormOpen(true);
  };

  const openEdit = (item: FoodItem) => {
    setEditingId(item.id);
    setNewFoodOption(undefined);
    setForm({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      minimumQuantity: item.minimumQuantity,
      expiryDate: item.expiryDate,
      boughtDate: item.boughtDate,
      cookedDate: item.cookedDate,
      location: item.location ?? "Pantry",
      notes: item.notes,
      buy: item.buy,
      opened: item.opened ?? false,
      freezable: item.freezable,
      freezeExtensionDays: item.freezeExtensionDays,
      estimatedValue: item.estimatedValue,
      estimatedWeightKg: item.estimatedWeightKg,
    });
    setMutationError("");
    setFormOpen(true);
  };

  const applyPrediction = (prediction: FoodPrediction) => {
    setNewFoodOption(undefined);
    setForm(predictionToFoodInput(prediction));
  };

  const selectFoodOption = (
    field: NewFoodOption["field"],
    value: string
  ) => {
    if (value === ADD_NEW_FOOD_OPTION) {
      setNewFoodOption({ field, value: "" });
      return;
    }

    setNewFoodOption(undefined);
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveNewFoodOption = () => {
    if (!newFoodOption) return;
    const value = newFoodOption.value.trim();
    if (!value) return;

    setForm((current) => ({
      ...current,
      [newFoodOption.field]: value,
    }));
    setNewFoodOption(undefined);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const values: FoodItemInput = {
      ...form,
      name: form.name.trim(),
      category: form.category.trim() || "other",
      location: form.location?.trim() || "Pantry",
      unit: form.unit.trim() || "item",
      quantity: Math.max(0, Number(form.quantity) || 0),
      minimumQuantity: Math.max(0, Number(form.minimumQuantity) || 0),
    };
    if (!values.name) return;

    setMutationError("");
    setPendingId(editingId ?? "new");
    try {
      const subId = await getSubAccountId();
      if (editingId) await updateFoodItem(editingId, values, subId);
      else await createFoodItem(values, subId);
      await fetchFoodItems(subId);
      setNewFoodOption(undefined);
      setFormOpen(false);
    } catch (error) {
      setMutationError(getErrorMessage(error, "Could not save item."));
    } finally {
      setPendingId(undefined);
    }
  };

  const quickAdd = async (input: FoodItemInput) => {
    setMutationError("");
    setPendingId("quick-add");
    try {
      const subId = await getSubAccountId();
      await createFoodItem(input, subId);
      await fetchFoodItems(subId);
      return true;
    } catch (error) {
      setMutationError(getErrorMessage(error, "Could not quick-add item."));
      return false;
    } finally {
      setPendingId(undefined);
    }
  };

  const persistPatch = async (
    item: FoodItem,
    values: Partial<FoodItem>,
    removeFromList = false
  ) => {
    setMutationError("");
    setPendingId(item.id);
    try {
      const subId = await getSubAccountId();
      await updateFoodItem(item.id, values, subId);
      setItems(
        removeFromList
          ? items.filter((current) => current.id !== item.id)
          : items.map((current) =>
              current.id === item.id
                ? { ...current, ...values, updatedAt: new Date().toISOString() }
                : current
            )
      );
      return true;
    } catch (error) {
      setMutationError(getErrorMessage(error, "Could not update item."));
      return false;
    } finally {
      setPendingId(undefined);
    }
  };

  const markOutcome = async (item: FoodItem, outcome: Outcome) => {
    await persistPatch(
      item,
      { lifecycleStatus: outcome, completedAt: new Date().toISOString() },
      true
    );
  };

  const freezeItem = async (item: FoodItem) => {
    const saved = await persistPatch(item, {
      location: "Freezer",
      opened: false,
      expiryDate: toDateInputAfterDays(item.freezeExtensionDays ?? 90),
    });
    if (saved) setSelectedLocation("Freezer");
  };

  const removeItem = async () => {
    if (!editingId) return;
    setMutationError("");
    setPendingId(editingId);
    try {
      const subId = await getSubAccountId();
      await deleteFoodItem(editingId, subId);
      setItems(items.filter((item) => item.id !== editingId));
      setFormOpen(false);
    } catch (error) {
      setMutationError(getErrorMessage(error, "Could not delete item."));
    } finally {
      setPendingId(undefined);
    }
  };

  return (
    <SwipeShell disabled refresh={fetchFoodItems}>
      <HeaderComponent title="Food Tracker">
        <div className="flex items-center justify-between pb-2">
          <div>
            <h1 className="text-xl font-bold">Food tracker</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Know what is left and what to use
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/food/dashboard"
              aria-label="Open food dashboard"
              className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
            >
              <FiPieChart />
            </Link>
            <button
              type="button"
              onClick={openNew}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 font-medium text-white"
            >
              <FiPlus /> Details
            </button>
          </div>
        </div>
      </HeaderComponent>

      <main className="mx-auto min-h-screen max-w-md space-y-4 px-4 pb-48 pt-[calc(var(--app-header-height,6rem)+1.5rem)] dark:text-white">
        {(mutationError || resourceErrors.foodItems) && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          >
            {mutationError || resourceErrors.foodItems}
          </div>
        )}

        {freezeCandidates.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={pendingId === item.id}
            onClick={() => void freezeItem(item)}
            className="flex w-full items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-left shadow-sm disabled:opacity-50 dark:border-sky-900 dark:bg-sky-950/40"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-600 text-xl text-white">
              <FaSnowflake />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold">Freeze {item.name} now</span>
              <span className="block text-xs text-sky-800 dark:text-sky-200">
                Expires within 1 day · tap to move to Freezer for {item.freezeExtensionDays ?? 90} more days
              </span>
            </span>
          </button>
        ))}

        <section className="grid grid-cols-4 gap-2" aria-label="Inventory filters">
          {[
            { key: "all" as Filter, label: "Items", value: items.length, icon: FiPackage },
            { key: "restock" as Filter, label: "To buy", value: restockCount, icon: FiShoppingCart },
            { key: "tonight" as Filter, label: "Tonight", value: tonightCount, icon: FiClock },
            { key: "expiring" as Filter, label: "7 days", value: expiringCount, icon: FiAlertTriangle },
          ].map(({ key, label, value, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-xl border p-2 text-left shadow-sm ${filter === key ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40" : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"}`}
            >
              <Icon className="mb-2 text-emerald-600" />
              <span className="block text-lg font-bold">{value}</span>
              <span className="block truncate text-[10px] text-gray-500 dark:text-gray-400">{label}</span>
            </button>
          ))}
        </section>

        <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 dark:border-gray-800 dark:bg-gray-900">
          <FiSearch className="text-gray-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search food, spices, location..."
            className="w-full bg-transparent py-3 outline-none"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
              <FiX />
            </button>
          )}
        </label>

        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Storage locations">
          {locations.map((location) => (
            <button
              key={location}
              type="button"
              onClick={() => setSelectedLocation(location)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${selectedLocation === location ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "bg-white text-gray-600 shadow-sm dark:bg-gray-900 dark:text-gray-300"}`}
            >
              {location}
            </button>
          ))}
        </div>

        {resourceLoading.foodItems ? (
          <div className="py-12 text-center text-sm text-gray-500">Loading food inventory...</div>
        ) : shownItems.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
            <FiPackage className="mx-auto mb-3 h-9 w-9 text-emerald-500" />
            <h2 className="font-semibold">
              {items.length ? "Nothing needs attention here" : "Pantry is empty"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Use quick-add below. Try typing “ap”.
            </p>
          </section>
        ) : (
          <section className="space-y-4" aria-label="Food inventory by location">
            {locationGroups.map(([location, groupItems]) => (
              <div key={location} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h2 className="flex items-center gap-2 text-sm font-bold">
                    <FiMapPin className="text-emerald-600" /> {location}
                  </h2>
                  <span className="text-xs text-gray-500">{groupItems.length} items</span>
                </div>
                {groupItems.map((item) => (
                  <FoodItemCard
                    key={item.id}
                    item={item}
                    pending={pendingId === item.id}
                    onEdit={openEdit}
                    onPatch={(current, values) => void persistPatch(current, values)}
                    onOutcome={(current, outcome) => void markOutcome(current, outcome)}
                  />
                ))}
              </div>
            ))}
          </section>
        )}
      </main>

      {formOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 sm:items-center"
          role="presentation"
          onMouseDown={(event) => event.target === event.currentTarget && setFormOpen(false)}
        >
          <form
            onSubmit={submit}
            className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl dark:bg-gray-950"
            aria-label={editingId ? "Edit food item" : "Add food item"}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingId ? "Edit item" : "Add item"}</h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>
            <div className="space-y-4">
              {mutationError && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                  {mutationError}
                </div>
              )}
              <div className="relative">
                <label className="block text-sm font-medium">
                  Name
                  <input
                    autoFocus
                    required
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    placeholder="Start typing, e.g. ap"
                    className={`mt-1 ${inputClass}`}
                  />
                </label>
                {form.name.trim() && formPredictions.length > 0 && !formPredictions.some((item) => item.name === form.name) && (
                  <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
                    {formPredictions.map((prediction) => (
                      <button
                        key={prediction.name}
                        type="button"
                        onClick={() => applyPrediction(prediction)}
                        className="flex w-full justify-between px-3 py-2 text-left text-sm hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                      >
                        <span className="font-medium">{prediction.name}</span>
                        <span className="text-xs text-gray-500">
                          {standardizeFoodLocation(prediction.location)} · {hasDefaultFoodExpiry(prediction.category) ? `${prediction.shelfLifeDays}d` : "No default expiry"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="food-location" className="block text-sm font-medium">
                  Location
                </label>
                <select
                  id="food-location"
                  value={form.location ?? "Pantry"}
                  onChange={(event) => selectFoodOption("location", event.target.value)}
                  className={`mt-1 ${inputClass}`}
                >
                  {locationOptions.map((location) => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                  <option value={ADD_NEW_FOOD_OPTION}>＋ Add new location</option>
                </select>
                {newFoodOption?.field === "location" && (
                  <div className="mt-2 space-y-1.5">
                    <input
                      autoFocus
                      value={newFoodOption.value}
                      onChange={(event) => setNewFoodOption({ ...newFoodOption, value: event.target.value })}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          saveNewFoodOption();
                        }
                      }}
                      placeholder="New location"
                      className={inputClass}
                    />
                    <div className="grid grid-cols-2 gap-1.5">
                      <button type="button" disabled={!newFoodOption.value.trim()} onClick={saveNewFoodOption} className="rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white disabled:opacity-50">Add</button>
                      <button type="button" onClick={() => setNewFoodOption(undefined)} className="rounded-lg border border-gray-200 py-2 text-xs dark:border-gray-700">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium">
                  Quantity
                  <input type="number" min="0" step="0.1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })} className={`mt-1 ${inputClass}`} />
                </label>
                <div>
                  <label htmlFor="food-unit" className="block text-sm font-medium">
                    Unit
                  </label>
                  <select
                    id="food-unit"
                    value={form.unit}
                    onChange={(event) => selectFoodOption("unit", event.target.value)}
                    className={`mt-1 ${inputClass}`}
                  >
                    {unitOptions.map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                    <option value={ADD_NEW_FOOD_OPTION}>＋ Add new unit</option>
                  </select>
                  {newFoodOption?.field === "unit" && (
                    <div className="mt-2 space-y-1.5">
                      <input
                        autoFocus
                        value={newFoodOption.value}
                        onChange={(event) => setNewFoodOption({ ...newFoodOption, value: event.target.value })}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            saveNewFoodOption();
                          }
                        }}
                        placeholder="New unit"
                        className={inputClass}
                      />
                      <div className="grid grid-cols-2 gap-1.5">
                        <button type="button" disabled={!newFoodOption.value.trim()} onClick={saveNewFoodOption} className="rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white disabled:opacity-50">Add</button>
                        <button type="button" onClick={() => setNewFoodOption(undefined)} className="rounded-lg border border-gray-200 py-2 text-xs dark:border-gray-700">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm font-medium dark:border-gray-700 dark:bg-gray-900">
                <input
                  type="checkbox"
                  checked={form.opened}
                  onChange={(event) =>
                    setForm({ ...form, opened: event.target.checked })
                  }
                  className="h-5 w-5 accent-emerald-600"
                />
                Opened
              </label>
              <label className="block text-sm font-medium">
                Expiry date
                <input type="date" value={form.expiryDate ?? ""} onChange={(event) => setForm({ ...form, expiryDate: event.target.value })} className={`mt-1 ${inputClass}`} />
              </label>
              {(form.category === "fruit" || form.category === "vegetable") && (
                <label className="block text-sm font-medium">
                  Date bought
                  <input type="date" value={form.boughtDate ?? ""} onChange={(event) => setForm({ ...form, boughtDate: event.target.value })} className={`mt-1 ${inputClass}`} />
                </label>
              )}
              {(form.category === "soup" || form.category === "cooked") && (
                <label className="block text-sm font-medium">
                  Date cooked
                  <input type="date" value={form.cookedDate ?? ""} onChange={(event) => setForm({ ...form, cookedDate: event.target.value })} className={`mt-1 ${inputClass}`} />
                </label>
              )}
              <details className="group rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-gray-700 marker:hidden dark:text-gray-200">
                  <span className="flex items-center justify-between">
                    Advanced options
                    <span className="text-lg transition-transform group-open:rotate-180">⌄</span>
                  </span>
                </summary>
                <div className="space-y-4 border-t border-gray-200 p-4 dark:border-gray-700">
                  <div>
                    <label htmlFor="food-category" className="block text-sm font-medium">
                      Category
                    </label>
                    <select
                      id="food-category"
                      value={form.category}
                      onChange={(event) => selectFoodOption("category", event.target.value)}
                      className={`mt-1 ${inputClass}`}
                    >
                      {categoryOptions.map((category) => (
                        <option key={category} value={category}>
                          {categories.find((option) => option.value === category)?.label ?? category}
                        </option>
                      ))}
                      <option value={ADD_NEW_FOOD_OPTION}>＋ Add new category</option>
                    </select>
                    {newFoodOption?.field === "category" && (
                      <div className="mt-2 space-y-1.5">
                        <input
                          autoFocus
                          value={newFoodOption.value}
                          onChange={(event) => setNewFoodOption({ ...newFoodOption, value: event.target.value })}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              saveNewFoodOption();
                            }
                          }}
                          placeholder="New category"
                          className={inputClass}
                        />
                        <div className="grid grid-cols-2 gap-1.5">
                          <button type="button" disabled={!newFoodOption.value.trim()} onClick={saveNewFoodOption} className="rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white disabled:opacity-50">Add</button>
                          <button type="button" onClick={() => setNewFoodOption(undefined)} className="rounded-lg border border-gray-200 py-2 text-xs dark:border-gray-700">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                  <label className="block text-sm font-medium">
                    Refill when quantity reaches
                    <input type="number" min="0" step="0.1" value={form.minimumQuantity} onChange={(event) => setForm({ ...form, minimumQuantity: Number(event.target.value) })} className={`mt-1 ${inputClass}`} />
                  </label>
                  <label className="block text-sm font-medium">
                    Est. value
                    <input type="number" min="0" step="0.01" value={form.estimatedValue ?? ""} onChange={(event) => setForm({ ...form, estimatedValue: event.target.value ? Number(event.target.value) : undefined })} placeholder="€" className={`mt-1 ${inputClass}`} />
                  </label>
                  <label className="flex items-center gap-3 rounded-xl bg-sky-50 p-3 dark:bg-sky-950/30">
                    <input type="checkbox" checked={form.freezable ?? false} onChange={(event) => setForm({ ...form, freezable: event.target.checked, freezeExtensionDays: event.target.checked ? form.freezeExtensionDays ?? 90 : undefined })} className="h-5 w-5 accent-sky-600" />
                    <span className="text-sm font-medium">Can be frozen</span>
                  </label>
                  {form.freezable && (
                    <label className="block text-sm font-medium">
                      Freezer shelf life (days)
                      <input type="number" min="1" max="730" value={form.freezeExtensionDays ?? 90} onChange={(event) => setForm({ ...form, freezeExtensionDays: Number(event.target.value) })} className={`mt-1 ${inputClass}`} />
                    </label>
                  )}
                  <label className="block text-sm font-medium">
                    Notes
                    <textarea rows={2} value={form.notes ?? ""} onChange={(event) => setForm({ ...form, notes: event.target.value })} className={`mt-1 ${inputClass}`} />
                  </label>
                  <label className="flex items-center gap-3 rounded-xl bg-white p-3 dark:bg-gray-950">
                    <input type="checkbox" checked={form.buy} onChange={(event) => setForm({ ...form, buy: event.target.checked })} className="h-5 w-5 accent-emerald-600" />
                    <span className="text-sm font-medium">Add to shopping list now</span>
                  </label>
                </div>
              </details>
            </div>
            <div className="mt-6 flex gap-3">
              {editingId && (
                <button disabled={Boolean(pendingId)} type="button" onClick={() => void removeItem()} className="rounded-xl border border-red-200 px-4 text-red-600 disabled:opacity-50" aria-label="Delete item permanently">
                  <FiTrash2 />
                </button>
              )}
              <button type="button" onClick={() => setFormOpen(false)} className="flex-1 rounded-xl border border-gray-200 py-3 font-medium dark:border-gray-700">
                Cancel
              </button>
              <button disabled={Boolean(pendingId)} type="submit" className="flex-1 rounded-xl bg-emerald-600 py-3 font-medium text-white disabled:opacity-50">
                {pendingId ? "Saving..." : "Save item"}
              </button>
            </div>
          </form>
        </div>
      )}

      <FoodQuickAdd disabled={Boolean(pendingId)} onAdd={quickAdd} />
      <FooterNav />
    </SwipeShell>
  );
}
