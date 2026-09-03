export function uploadWardrobePng({
  blob,
  uploadUrl,
  onProgress,
}: {
  blob: Blob;
  uploadUrl: string;
  onProgress?: (progress: number | null) => void;
}) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", uploadUrl);
    request.setRequestHeader("Content-Type", "image/png");

    request.upload.onprogress = (event) => {
      onProgress?.(event.lengthComputable ? event.loaded / event.total : null);
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress?.(1);
        resolve();
        return;
      }
      reject(new Error(`Image upload failed (${request.status}).`));
    };
    request.onerror = () => reject(new Error("Network error during image upload."));
    request.onabort = () => reject(new Error("Image upload cancelled."));
    request.send(blob);
  });
}

