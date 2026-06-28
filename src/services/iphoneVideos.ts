import { getTokens } from "./amplify";

export const IPHONE_VIDEO_BUCKET_NAME =
  "awsnewsagentstack-iphonevideobucket977048a4-v9ijkwtg6evz";
export const IPHONE_VIDEO_ROOT_PREFIX = "iphone-videos";
export const IPHONE_VIDEO_API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_IPHONE_VIDEO_API_BASE_URL ??
    import.meta.env.VITE_API_BASE_URL ??
    "https://ybnvf6a6ce.execute-api.eu-west-1.amazonaws.com/prod/"
);

export const DEFAULT_IPHONE_VIDEO_FOLDERS = [
  `${IPHONE_VIDEO_ROOT_PREFIX}/iphone-dolly`,
  `${IPHONE_VIDEO_ROOT_PREFIX}/iphone-rexben`,
];

export type IphoneVideoItem = {
  key: string;
  sizeBytes: number;
  lastModified?: string;
  etag?: string;
  url: string;
  downloadUrl?: string;
};

export type ListIphoneVideosParams = {
  prefix: string;
  limit?: number;
  cursor?: string | null;
};

export type ListIphoneVideosResponse = {
  bucketName: string;
  prefix: string;
  limit: number;
  count: number;
  items: IphoneVideoItem[];
  nextCursor?: string | null;
  truncated?: boolean;
};

export type RequestIphoneVideoUploadUrlParams = {
  sessionId: string;
  folder: string;
  fileName: string;
  contentType: string;
};

export type IphoneVideoUploadUrl = {
  bucketName: string;
  key: string;
  s3Uri: string;
  uploadUrl: string;
  method: "PUT";
  expiresIn: number;
  contentType: string;
  prefix: string;
};

export type DeleteIphoneVideosResponse = {
  deletedCount: number;
  errorCount: number;
  errors?: unknown[];
};

type VideoApiErrorPayload = {
  error?: string;
  message?: string;
};

export class IphoneVideoServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "IphoneVideoServiceError";
    this.statusCode = statusCode;
  }
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/g, "");
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return undefined;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function requestVideoApi<T>(path: string, init?: RequestInit) {
  const token = await getTokens();
  if (!token?.idToken) {
    throw new IphoneVideoServiceError("No auth token available", 401);
  }

  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token.idToken}`);

  const response = await fetch(`${IPHONE_VIDEO_API_BASE_URL}${path}`, {
    ...init,
    headers,
  });
  const payload = await readJson(response);

  if (!response.ok) {
    const errorPayload =
      payload && typeof payload === "object"
        ? (payload as VideoApiErrorPayload)
        : {};
    const message =
      errorPayload.error ??
      errorPayload.message ??
      (typeof payload === "string" ? payload : response.statusText) ??
      "Video request failed.";
    throw new IphoneVideoServiceError(message, response.status);
  }

  return payload as T;
}

export function sanitizeVideoPrefix(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9/_-]+/g, "-")
    .replace(/\/+/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .slice(0, 240);
}

export function normalizeVideoFolderPrefix(value: string) {
  const sanitized = sanitizeVideoPrefix(value);
  if (!sanitized || sanitized === IPHONE_VIDEO_ROOT_PREFIX) {
    return IPHONE_VIDEO_ROOT_PREFIX;
  }

  if (sanitized.startsWith(`${IPHONE_VIDEO_ROOT_PREFIX}/`)) {
    return sanitized;
  }

  return `${IPHONE_VIDEO_ROOT_PREFIX}/${sanitized}`;
}

export function getVideoFolderLabel(prefix: string) {
  const normalized = normalizeVideoFolderPrefix(prefix);
  if (normalized === IPHONE_VIDEO_ROOT_PREFIX) {
    return "All iPhone videos";
  }

  return normalized.replace(`${IPHONE_VIDEO_ROOT_PREFIX}/`, "");
}

export function getDefaultVideoFolder() {
  return DEFAULT_IPHONE_VIDEO_FOLDERS[1];
}

export function deriveVideoFolders(items: IphoneVideoItem[]) {
  const folders = new Set<string>([
    IPHONE_VIDEO_ROOT_PREFIX,
    ...DEFAULT_IPHONE_VIDEO_FOLDERS,
  ]);

  items.forEach((item) => {
    const key = sanitizeVideoPrefix(item.key);
    const rootWithSlash = `${IPHONE_VIDEO_ROOT_PREFIX}/`;
    if (!key.startsWith(rootWithSlash)) return;

    const [firstSegment] = key.slice(rootWithSlash.length).split("/");
    if (firstSegment) {
      folders.add(`${IPHONE_VIDEO_ROOT_PREFIX}/${firstSegment}`);
    }
  });

  return Array.from(folders).sort((a, b) => {
    if (a === IPHONE_VIDEO_ROOT_PREFIX) return -1;
    if (b === IPHONE_VIDEO_ROOT_PREFIX) return 1;
    return getVideoFolderLabel(a).localeCompare(getVideoFolderLabel(b));
  });
}

export function getVideoContentType(file: File) {
  const normalized = file.type.toLowerCase().split(";")[0].trim();
  if (normalized === "video/mp4" || normalized === "video/quicktime") {
    return normalized;
  }

  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".mp4")) return "video/mp4";
  if (lowerName.endsWith(".mov") || lowerName.endsWith(".qt")) {
    return "video/quicktime";
  }

  return "";
}

export function listIphoneVideos({
  prefix,
  limit = 20,
  cursor,
}: ListIphoneVideosParams) {
  const params = new URLSearchParams({
    prefix: normalizeVideoFolderPrefix(prefix),
    limit: String(limit),
  });
  if (cursor) params.set("cursor", cursor);

  return requestVideoApi<ListIphoneVideosResponse>(
    `/video-library/items?${params.toString()}`
  );
}

export function requestIphoneVideoUploadUrl({
  folder,
  ...body
}: RequestIphoneVideoUploadUrlParams) {
  return requestVideoApi<IphoneVideoUploadUrl>("/video-upload-url", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      ...body,
      folder: normalizeVideoFolderPrefix(folder),
    }),
  });
}

export function deleteIphoneVideos(prefix: string, keys: string[]) {
  const params = new URLSearchParams({
    prefix: normalizeVideoFolderPrefix(prefix),
  });

  return requestVideoApi<DeleteIphoneVideosResponse>(
    `/video-library/items?${params.toString()}`,
    {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ keys }),
    }
  );
}

export function uploadIphoneVideoFile({
  file,
  uploadUrl,
  contentType,
  onProgress,
}: {
  file: File;
  uploadUrl: string;
  contentType: string;
  onProgress?: (percent: number | null) => void;
}) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("content-type", contentType);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        onProgress?.(null);
        return;
      }

      onProgress?.(
        Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100)))
      );
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }

      reject(new Error(`Upload failed with HTTP ${xhr.status}.`));
    };

    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.onabort = () => reject(new Error("Upload aborted."));
    xhr.send(file);
  });
}
