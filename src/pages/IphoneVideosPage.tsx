import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import {
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiExternalLink,
  FiFolderPlus,
  FiPlayCircle,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiUploadCloud,
  FiVideo,
  FiX,
} from "react-icons/fi";
import { FooterNav } from "../components/FooterNav";
import { HeaderComponent } from "../components/HeaderComponent";
import SwipeShell from "../components/SwipeShell";
import {
  DEFAULT_IPHONE_VIDEO_FOLDERS,
  IPHONE_VIDEO_BUCKET_NAME,
  IPHONE_VIDEO_ROOT_PREFIX,
  deleteIphoneVideos,
  deriveVideoFolders,
  getDefaultVideoFolder,
  getVideoContentType,
  getVideoFolderLabel,
  listIphoneVideos,
  normalizeVideoFolderPrefix,
  requestIphoneVideoUploadUrl,
  uploadIphoneVideoFile,
  type IphoneVideoItem,
} from "../services/iphoneVideos";

type UploadStatus = "queued" | "signing" | "uploading" | "done" | "failed";

type UploadQueueItem = {
  id: string;
  file: File;
  contentType: string;
  progress: number | null;
  status: UploadStatus;
  message?: string;
  s3Uri?: string;
};

const FOLDER_STORAGE_KEY = "iphone-video-folder";
const SESSION_STORAGE_KEY = "iphone-video-session";
const PAGE_SIZE_OPTIONS = [10, 20, 50];
const VIDEO_PAGE_SHELL_CLASS = "sm:max-w-2xl lg:max-w-6xl";

function getStoredFolder() {
  if (typeof localStorage === "undefined") return getDefaultVideoFolder();
  return normalizeVideoFolderPrefix(
    localStorage.getItem(FOLDER_STORAGE_KEY) ?? getDefaultVideoFolder()
  );
}

function getStoredSessionId() {
  if (typeof localStorage === "undefined") {
    return `iphone-${Date.now().toString(36)}`;
  }

  const stored = localStorage.getItem(SESSION_STORAGE_KEY);
  if (stored) return stored;

  const generated = `iphone-${Date.now().toString(36)}`;
  localStorage.setItem(SESSION_STORAGE_KEY, generated);
  return generated;
}

function makeUploadId(file: File) {
  return [file.name, file.size, file.lastModified].join("|");
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function fileNameFromKey(key: string) {
  return key.split("/").pop() || key;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function mergeFolders(...groups: string[][]) {
  return Array.from(new Set(groups.flat().map(normalizeVideoFolderPrefix))).sort(
    (a, b) => {
      if (a === IPHONE_VIDEO_ROOT_PREFIX) return -1;
      if (b === IPHONE_VIDEO_ROOT_PREFIX) return 1;
      return getVideoFolderLabel(a).localeCompare(getVideoFolderLabel(b));
    }
  );
}

function startDownload(url: string, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noreferrer";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

export function IphoneVideosPage() {
  const [selectedFolder, setSelectedFolder] = useState(getStoredFolder);
  const [folders, setFolders] = useState(() =>
    mergeFolders([
      IPHONE_VIDEO_ROOT_PREFIX,
      ...DEFAULT_IPHONE_VIDEO_FOLDERS,
      getStoredFolder(),
    ])
  );
  const [newFolderName, setNewFolderName] = useState("");
  const [sessionId, setSessionId] = useState(getStoredSessionId);
  const [pageSize, setPageSize] = useState(20);
  const [items, setItems] = useState<IphoneVideoItem[]>([]);
  const [bucketName, setBucketName] = useState(IPHONE_VIDEO_BUCKET_NAME);
  const [activeVideo, setActiveVideo] = useState<IphoneVideoItem | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCursors, setPageCursors] = useState<Array<string | null>>([null]);
  const [nextCursorByPage, setNextCursorByPage] = useState<
    Record<number, string | null>
  >({});
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState("");
  const [statusMessage, setStatusMessage] = useState("Ready.");
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const selectedKeySet = useMemo(() => new Set(selectedKeys), [selectedKeys]);
  const selectedItems = useMemo(
    () => items.filter((item) => selectedKeySet.has(item.key)),
    [items, selectedKeySet]
  );
  const hasNextPage = Boolean(nextCursorByPage[pageIndex]);
  const allCurrentPageSelected =
    items.length > 0 && items.every((item) => selectedKeySet.has(item.key));

  const loadPage = useCallback(
    async (folder: string, page: number, cursor: string | null) => {
      const normalizedFolder = normalizeVideoFolderPrefix(folder);
      setLibraryLoading(true);
      setLibraryError("");

      try {
        const response = await listIphoneVideos({
          prefix: normalizedFolder,
          limit: pageSize,
          cursor,
        });
        const nextItems = Array.isArray(response.items) ? response.items : [];
        setItems(nextItems);
        setActiveVideo((current) => {
          if (!current) return null;
          return nextItems.find((item) => item.key === current.key) ?? null;
        });
        setBucketName(response.bucketName || IPHONE_VIDEO_BUCKET_NAME);
        setFolders((current) =>
          mergeFolders(current, deriveVideoFolders(nextItems), [normalizedFolder])
        );
        setNextCursorByPage((current) => ({
          ...current,
          [page]: response.nextCursor ?? null,
        }));
        setSelectedKeys([]);
        setPageIndex(page);
        setStatusMessage(
          `Loaded ${response.count ?? nextItems.length} video(s) from ${getVideoFolderLabel(
            normalizedFolder
          )}.`
        );
      } catch (error) {
        setItems([]);
        setSelectedKeys([]);
        setActiveVideo(null);
        setLibraryError(getErrorMessage(error, "Could not load videos."));
      } finally {
        setLibraryLoading(false);
      }
    },
    [pageSize]
  );

  const resetAndLoad = useCallback(
    async (folder = selectedFolder) => {
      setPageCursors([null]);
      setNextCursorByPage({});
      await loadPage(folder, 0, null);
    },
    [loadPage, selectedFolder]
  );

  useEffect(() => {
    localStorage.setItem(FOLDER_STORAGE_KEY, selectedFolder);
    void resetAndLoad(selectedFolder);
  }, [resetAndLoad, selectedFolder]);

  useEffect(() => {
    let mounted = true;

    listIphoneVideos({ prefix: IPHONE_VIDEO_ROOT_PREFIX, limit: 100 })
      .then((response) => {
        if (!mounted) return;
        setFolders((current) =>
          mergeFolders(current, deriveVideoFolders(response.items ?? []))
        );
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const updateUploadItem = useCallback(
    (id: string, patch: Partial<UploadQueueItem>) => {
      setUploadQueue((current) =>
        current.map((item) => (item.id === id ? { ...item, ...patch } : item))
      );
    },
    []
  );

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    let skipped = 0;
    let added = 0;
    setUploadQueue((current) => {
      const existingIds = new Set(current.map((item) => item.id));
      const next = [...current];

      files.forEach((file) => {
        const contentType = getVideoContentType(file);
        if (!contentType) {
          skipped += 1;
          return;
        }

        const id = makeUploadId(file);
        if (existingIds.has(id)) return;

        existingIds.add(id);
        next.push({
          id,
          file,
          contentType,
          progress: 0,
          status: "queued",
        });
        added += 1;
      });

      return next;
    });

    if (added > 0) {
      setStatusMessage(`Queued ${added} video(s).`);
    }
    if (skipped > 0) {
      setLibraryError("Only .mov and .mp4 videos are supported.");
    }
  }, []);

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) addFiles(event.target.files);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragActive(false);
    addFiles(event.dataTransfer.files);
  };

  const removeUploadItem = (id: string) => {
    setUploadQueue((current) => current.filter((item) => item.id !== id));
  };

  const clearFinishedUploads = () => {
    setUploadQueue((current) =>
      current.filter((item) => item.status !== "done")
    );
  };

  const createFolder = () => {
    const normalized = normalizeVideoFolderPrefix(newFolderName);
    if (normalized === IPHONE_VIDEO_ROOT_PREFIX && newFolderName.trim()) {
      setLibraryError("Use a subfolder name inside iphone-videos.");
      return;
    }

    setFolders((current) => mergeFolders(current, [normalized]));
    setSelectedFolder(normalized);
    setNewFolderName("");
    setLibraryError("");
    setStatusMessage(
      `${getVideoFolderLabel(normalized)} selected. First upload will create it in S3.`
    );
  };

  const changeSessionId = (value: string) => {
    const nextValue = value
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .slice(0, 80);
    setSessionId(nextValue);
    localStorage.setItem(SESSION_STORAGE_KEY, nextValue);
  };

  const uploadQueuedVideos = async () => {
    const pending = uploadQueue.filter((item) =>
      ["queued", "failed"].includes(item.status)
    );
    if (pending.length === 0) {
      setLibraryError("Queue at least one video first.");
      return;
    }
    if (!sessionId.trim()) {
      setLibraryError("Session folder is required.");
      return;
    }

    setUploading(true);
    setLibraryError("");
    let successCount = 0;
    let failureCount = 0;

    for (const item of pending) {
      updateUploadItem(item.id, {
        status: "signing",
        progress: 0,
        message: "Requesting upload URL.",
      });

      try {
        const uploadMeta = await requestIphoneVideoUploadUrl({
          sessionId,
          folder: selectedFolder,
          fileName: item.file.name,
          contentType: item.contentType,
        });
        updateUploadItem(item.id, {
          status: "uploading",
          message: "Uploading.",
          s3Uri: uploadMeta.s3Uri,
        });

        await uploadIphoneVideoFile({
          file: item.file,
          uploadUrl: uploadMeta.uploadUrl,
          contentType: uploadMeta.contentType,
          onProgress: (progress) => {
            updateUploadItem(item.id, { progress });
          },
        });

        successCount += 1;
        updateUploadItem(item.id, {
          status: "done",
          progress: 100,
          message: "Uploaded.",
          s3Uri: uploadMeta.s3Uri,
        });
      } catch (error) {
        failureCount += 1;
        updateUploadItem(item.id, {
          status: "failed",
          message: getErrorMessage(error, "Upload failed."),
        });
      }
    }

    setUploading(false);
    setStatusMessage(
      `Upload complete. Success: ${successCount}. Failed: ${failureCount}.`
    );
    await resetAndLoad(selectedFolder);
  };

  const goToPreviousPage = async () => {
    if (pageIndex <= 0) return;

    const nextPage = pageIndex - 1;
    await loadPage(selectedFolder, nextPage, pageCursors[nextPage] ?? null);
  };

  const goToNextPage = async () => {
    const cursor = nextCursorByPage[pageIndex];
    if (!cursor) return;

    const nextPage = pageIndex + 1;
    setPageCursors((current) => {
      const next = [...current];
      next[nextPage] = cursor;
      return next;
    });
    await loadPage(selectedFolder, nextPage, cursor);
  };

  const toggleSelectedKey = (key: string) => {
    setSelectedKeys((current) =>
      current.includes(key)
        ? current.filter((itemKey) => itemKey !== key)
        : [...current, key]
    );
  };

  const toggleAllCurrentPage = () => {
    if (allCurrentPageSelected) {
      setSelectedKeys((current) =>
        current.filter((key) => !items.some((item) => item.key === key))
      );
      return;
    }

    setSelectedKeys((current) =>
      Array.from(new Set([...current, ...items.map((item) => item.key)]))
    );
  };

  const downloadSelected = async () => {
    for (let index = 0; index < selectedItems.length; index += 1) {
      const item = selectedItems[index];
      startDownload(item.downloadUrl || item.url, fileNameFromKey(item.key));
      if (index < selectedItems.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 180));
      }
    }
  };

  const deleteSelected = async () => {
    if (selectedKeys.length === 0) return;

    const confirmed = window.confirm(
      `Delete ${selectedKeys.length} selected video(s)? This cannot be undone.`
    );
    if (!confirmed) return;

    setLibraryLoading(true);
    setLibraryError("");
    try {
      const result = await deleteIphoneVideos(selectedFolder, selectedKeys);
      setStatusMessage(
        `Deleted ${result.deletedCount ?? 0} video(s). Errors: ${
          result.errorCount ?? 0
        }.`
      );
      await resetAndLoad(selectedFolder);
    } catch (error) {
      setLibraryError(getErrorMessage(error, "Delete failed."));
    } finally {
      setLibraryLoading(false);
    }
  };

  return (
    <SwipeShell refresh={() => resetAndLoad(selectedFolder)} toRight="/">
      <HeaderComponent className={`${VIDEO_PAGE_SHELL_CLASS} sm:px-4`}>
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold">iPhone Videos</h1>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              {getVideoFolderLabel(selectedFolder)} · {items.length} shown
            </p>
          </div>
          <button
            type="button"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm hover:text-blue-600 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            onClick={() => resetAndLoad(selectedFolder)}
            disabled={libraryLoading}
            aria-label="Refresh videos"
          >
            <FiRefreshCw className={libraryLoading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_6rem]">
          <select
            value={selectedFolder}
            onChange={(event) =>
              setSelectedFolder(normalizeVideoFolderPrefix(event.target.value))
            }
            className="h-9 min-w-0 rounded-lg border border-gray-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
            aria-label="Select video folder"
          >
            {folders.map((folder) => (
              <option key={folder} value={folder}>
                {getVideoFolderLabel(folder)}
              </option>
            ))}
          </select>
          <select
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
            className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
            aria-label="Videos per page"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </HeaderComponent>

      <main
        className={`mx-auto min-h-screen w-full max-w-md ${VIDEO_PAGE_SHELL_CLASS} px-3 pb-28 pt-40 sm:px-4 lg:pt-32 dark:text-white`}
      >
        <section className="grid gap-3 lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)] lg:items-start">
          <aside className="grid gap-3 lg:sticky lg:top-32">
            <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <input
                value={newFolderName}
                onChange={(event) => setNewFolderName(event.target.value)}
                placeholder="New folder name"
                className="h-10 min-w-0 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-950"
              />
              <button
                type="button"
                onClick={createFolder}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-medium text-white shadow-sm disabled:opacity-60 sm:w-auto"
                disabled={!newFolderName.trim()}
              >
                <FiFolderPlus />
                <span>Add</span>
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <FiUploadCloud className="text-blue-600" />
                <h2 className="truncate text-sm font-semibold">Upload</h2>
              </div>
              <button
                type="button"
                className="text-xs text-gray-500 hover:text-blue-600 disabled:opacity-60 dark:text-gray-400"
                onClick={clearFinishedUploads}
                disabled={!uploadQueue.some((item) => item.status === "done")}
              >
                Clear done
              </button>
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Session folder
              </label>
              <input
                value={sessionId}
                onChange={(event) => changeSessionId(event.target.value)}
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-950"
              />
            </div>

            <label
              className={`flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 py-5 text-center text-sm transition ${
                dragActive
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200"
                  : "border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 dark:border-gray-700 dark:text-gray-400"
              }`}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              <FiVideo className="mb-2 text-2xl" />
              <span className="font-medium">Choose or drop videos</span>
              <span className="mt-1 text-xs">.mov and .mp4</span>
              <input
                type="file"
                accept="video/mp4,video/quicktime,.mov,.mp4"
                multiple
                className="hidden"
                onChange={handleFileInput}
              />
            </label>

            {uploadQueue.length > 0 && (
              <div className="mt-3 grid gap-2">
                {uploadQueue.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-gray-100 bg-gray-50 p-2 dark:border-gray-800 dark:bg-gray-950"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {item.file.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatBytes(item.file.size)} · {item.status}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:hover:bg-gray-800 dark:hover:text-white"
                        onClick={() => removeUploadItem(item.id)}
                        disabled={uploading}
                        aria-label={`Remove ${item.file.name}`}
                      >
                        <FiX />
                      </button>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                      <div
                        className={`h-full rounded-full ${
                          item.status === "failed"
                            ? "bg-red-500"
                            : item.status === "done"
                            ? "bg-emerald-500"
                            : "bg-blue-600"
                        }`}
                        style={{ width: `${item.progress ?? 18}%` }}
                      />
                    </div>
                    {item.message && (
                      <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                        {item.message}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-medium text-white shadow-sm disabled:opacity-60"
              onClick={uploadQueuedVideos}
              disabled={uploading || uploadQueue.length === 0}
            >
              <FiPlus />
              <span>{uploading ? "Uploading" : "Upload to S3"}</span>
            </button>
          </div>
          </aside>

          <section className="min-w-0 rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold">Library</h2>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  {bucketName}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  className="grid h-8 w-8 place-items-center rounded-lg border border-gray-200 text-gray-600 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200"
                  onClick={downloadSelected}
                  disabled={selectedItems.length === 0}
                  aria-label="Download selected videos"
                >
                  <FiDownload />
                </button>
                <button
                  type="button"
                  className="grid h-8 w-8 place-items-center rounded-lg border border-red-200 text-red-600 disabled:opacity-50 dark:border-red-900"
                  onClick={deleteSelected}
                  disabled={selectedKeys.length === 0 || libraryLoading}
                  aria-label="Delete selected videos"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>

            {(libraryError || statusMessage) && (
              <p
                className={`mb-3 rounded-lg px-3 py-2 text-xs ${
                  libraryError
                    ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-200"
                    : "bg-gray-50 text-gray-600 dark:bg-gray-950 dark:text-gray-300"
                }`}
              >
                {libraryError || statusMessage}
              </p>
            )}

            {activeVideo && (
              <div className="mb-3 overflow-hidden rounded-lg border border-gray-200 bg-black dark:border-gray-700">
                <video
                  key={activeVideo.url}
                  src={activeVideo.url}
                  controls
                  playsInline
                  className="aspect-video w-full bg-black"
                />
                <div className="bg-white p-2 dark:bg-gray-950">
                  <p className="truncate text-xs text-gray-600 dark:text-gray-300">
                    {fileNameFromKey(activeVideo.key)}
                  </p>
                </div>
              </div>
            )}

            <div className="mb-2 flex items-center justify-between gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 text-xs font-medium text-gray-600 disabled:opacity-50 dark:text-gray-300"
                onClick={toggleAllCurrentPage}
                disabled={items.length === 0}
              >
                <span className="grid h-5 w-5 place-items-center rounded border border-gray-300 dark:border-gray-700">
                  {allCurrentPageSelected && <FiCheck />}
                </span>
                <span>Select page</span>
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Page {pageIndex + 1}
              </span>
            </div>

            {libraryLoading && items.length === 0 ? (
              <div className="grid gap-2">
                {[0, 1, 2].map((key) => (
                  <div
                    key={key}
                    className="h-20 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
                  />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                No videos found.
              </div>
            ) : (
              <div className="grid gap-2 xl:grid-cols-2">
                {items.map((item) => (
                  <article
                    key={item.key}
                    className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-950"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded border border-gray-300 text-blue-600 dark:border-gray-700"
                        onClick={() => toggleSelectedKey(item.key)}
                        aria-label={`Select ${fileNameFromKey(item.key)}`}
                      >
                        {selectedKeySet.has(item.key) && <FiCheck />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {fileNameFromKey(item.key)}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {formatBytes(item.sizeBytes)} ·{" "}
                          {formatDate(item.lastModified)}
                        </p>
                        <p className="mt-1 break-all text-[11px] text-gray-400 dark:text-gray-500">
                          {item.key}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 pl-9">
                      <button
                        type="button"
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-xs font-medium text-gray-700 hover:text-blue-600 dark:border-gray-700 dark:text-gray-200"
                        onClick={() => setActiveVideo(item)}
                      >
                        <FiPlayCircle />
                        <span>Play</span>
                      </button>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-xs font-medium text-gray-700 hover:text-blue-600 dark:border-gray-700 dark:text-gray-200"
                      >
                        <FiExternalLink />
                        <span>Open</span>
                      </a>
                      <button
                        type="button"
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-xs font-medium text-gray-700 hover:text-blue-600 dark:border-gray-700 dark:text-gray-200"
                        onClick={() =>
                          startDownload(
                            item.downloadUrl || item.url,
                            fileNameFromKey(item.key)
                          )
                        }
                      >
                        <FiDownload />
                        <span>Download</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200"
                onClick={goToPreviousPage}
                disabled={libraryLoading || pageIndex <= 0}
              >
                <FiChevronLeft />
                <span>Previous</span>
              </button>
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200"
                onClick={goToNextPage}
                disabled={libraryLoading || !hasNextPage}
              >
                <span>Next</span>
                <FiChevronRight />
              </button>
            </div>
          </section>
        </section>
      </main>

      <FooterNav className={VIDEO_PAGE_SHELL_CLASS} />
    </SwipeShell>
  );
}
