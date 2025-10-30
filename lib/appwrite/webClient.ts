"use client";

import { appwriteConfig } from "@/lib/appwrite/config";

type UploadProgressHandler = (progress: {
  loaded: number;
  total: number;
  percentage: number;
}) => void;

interface UploadToStorageOptions {
  file: File;
  onProgress?: UploadProgressHandler;
  onAbort?: () => void;
  onError?: (error: Error) => void;
}

export interface StorageUploadResult {
  $id: string;
  name: string;
  sizeOriginal: number;
}

interface StorageUploadTask {
  response: Promise<StorageUploadResult>;
  cancel: () => void;
}

type JwtCache = {
  token: string;
  expiresAt: number;
};

let jwtCache: JwtCache | null = null;
let pendingJwtPromise: Promise<JwtCache | null> | null = null;

const fetchJWT = async (): Promise<JwtCache | null> => {
  try {
    const response = await fetch("/api/appwrite/jwt", {
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      jwt: string;
      expireAt: string;
    };

    const expiresAt = new Date(data.expireAt).getTime();

    return {
      token: data.jwt,
      expiresAt,
    };
  } catch (error) {
    console.error("Unable to fetch Appwrite JWT", error);
    return null;
  }
};

const getValidJWT = async (): Promise<string> => {
  const now = Date.now();

  if (jwtCache && jwtCache.expiresAt - 60_000 > now) {
    return jwtCache.token;
  }

  if (!pendingJwtPromise) {
    pendingJwtPromise = fetchJWT().finally(() => {
      pendingJwtPromise = null;
    });
  }

  const fresh = await pendingJwtPromise;

  if (!fresh) {
    throw new Error("Unable to authenticate upload request");
  }

  jwtCache = fresh;
  return fresh.token;
};

const createProgressHandler = (callback?: UploadProgressHandler) =>
  (event: ProgressEvent<EventTarget>) => {
    if (!callback) return;
    if (!event.lengthComputable) return;

    const percentage = Math.round((event.loaded / event.total) * 100);

    callback({
      loaded: event.loaded,
      total: event.total,
      percentage,
    });
  };

export const uploadFileToStorage = async ({
  file,
  onProgress,
  onAbort,
  onError,
}: UploadToStorageOptions): Promise<StorageUploadTask> => {
  const jwt = await getValidJWT();

  const xhr = new XMLHttpRequest();
  const url = `${appwriteConfig.endpointUrl}/storage/buckets/${appwriteConfig.bucketId}/files`;

  xhr.open("POST", url, true);
  xhr.responseType = "json";
  xhr.withCredentials = true;

  xhr.setRequestHeader("X-Appwrite-Project", appwriteConfig.projectId);
  xhr.setRequestHeader("X-Appwrite-JWT", jwt);
  xhr.setRequestHeader("X-Appwrite-Response-Format", "1.0");

  xhr.upload.onprogress = createProgressHandler(onProgress);

  const response = new Promise<StorageUploadResult>((resolve, reject) => {
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const body =
          (xhr.response as StorageUploadResult | undefined) ??
          JSON.parse(xhr.responseText ?? "{}");

        if (!body || !body.$id) {
          const error = new Error("Invalid response from storage service");
          onError?.(error);
          reject(error);
          return;
        }

        resolve({
          $id: body.$id,
          name: body.name ?? file.name,
          sizeOriginal: body.sizeOriginal ?? file.size,
        });
        return;
      }

      const message =
        typeof xhr.response?.message === "string"
          ? xhr.response.message
          : xhr.statusText || "Upload failed";
      const error = new Error(message);
      onError?.(error);
      reject(error);
    };

    xhr.onerror = () => {
      const error = new Error("Network error while uploading file");
      onError?.(error);
      reject(error);
    };

    xhr.onabort = () => {
      onAbort?.();
      reject(new DOMException("Upload aborted", "AbortError"));
    };
  });

  const formData = new FormData();
  formData.append("fileId", crypto.randomUUID());
  formData.append("file", file);

  xhr.send(formData);

  return {
    response,
    cancel: () => {
      if (xhr.readyState !== XMLHttpRequest.DONE) {
        xhr.abort();
      }
    },
  };
};
