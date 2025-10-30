"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { uploadFile } from "@/lib/actions/file.actions";
import {
  StorageUploadResult,
  uploadFileToStorage,
} from "@/lib/appwrite/webClient";

export type UploadStatus = "uploading" | "success" | "error" | "canceled";

export interface UploadItem {
  id: string;
  file: File;
  folderId?: string;
  status: UploadStatus;
  progress: number;
  error?: string;
}

interface UseUploadManagerOptions {
  ownerId: string;
  accountId: string;
  path: string;
  notifyError: (message: string) => void;
}

const getFolderPath = (file: File) => {
  const relative = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
  if (!relative) return "";
  const segments = relative.split("/");
  segments.pop();
  return segments.join("/");
};

export const useUploadManager = ({
  ownerId,
  accountId,
  path,
  notifyError,
}: UseUploadManagerOptions) => {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const uploadsRef = useRef<UploadItem[]>(uploads);
  const cancelersRef = useRef<Record<string, () => void>>({});

  useEffect(() => {
    uploadsRef.current = uploads;
  }, [uploads]);

  const updateUpload = useCallback((id: string, partial: Partial<UploadItem>) => {
    setUploads((prev) =>
      prev.map((upload) =>
        upload.id === id
          ? {
              ...upload,
              ...partial,
            }
          : upload,
      ),
    );
  }, []);

  const finalizeUpload = useCallback(
    (id: string, result: StorageUploadResult) => {
      void (async () => {
        try {
          const current = uploadsRef.current.find((item) => item.id === id);
          await uploadFile({
            fileId: result.$id,
            name: result.name,
            size: result.sizeOriginal,
            ownerId,
            accountId,
            folderId: current?.folderId,
            path,
          });

          updateUpload(id, { status: "success", progress: 100 });
        } catch (error) {
          const current = uploadsRef.current.find((item) => item.id === id);
          const message =
            error instanceof Error
              ? error.message
              : "Failed to save uploaded file";
          notifyError(
            current?.file
              ? `${current.file.name}: ${message}`
              : message,
          );
          updateUpload(id, {
            status: "error",
            error: message,
          });
        } finally {
          delete cancelersRef.current[id];
        }
      })();
    },
    [accountId, notifyError, ownerId, path, updateUpload],
  );

  const startUpload = useCallback(
    (upload: UploadItem) => {
      updateUpload(upload.id, {
        status: "uploading",
        progress: 0,
        error: undefined,
      });

      void (async () => {
        try {
          const task = await uploadFileToStorage({
            file: upload.file,
            onProgress: ({ percentage }) =>
              updateUpload(upload.id, { progress: percentage }),
            onAbort: () => {
              updateUpload(upload.id, {
                status: "canceled",
                error: "Upload canceled",
              });
            },
            onError: (error) => {
              updateUpload(upload.id, {
                status: "error",
                error: error.message,
              });
            },
          });

          cancelersRef.current[upload.id] = task.cancel;
          const result = await task.response;
          finalizeUpload(upload.id, result);
        } catch (error) {
          delete cancelersRef.current[upload.id];
          if (error instanceof DOMException && error.name === "AbortError") {
            updateUpload(upload.id, {
              status: "canceled",
              error: "Upload canceled",
            });
            return;
          }

          const message =
            error instanceof Error ? error.message : "Failed to upload file";
          notifyError(`${upload.file.name}: ${message}`);
          updateUpload(upload.id, {
            status: "error",
            error: message,
          });
        }
      })();
    },
    [finalizeUpload, notifyError, updateUpload],
  );

  const addFiles = useCallback(
    (files: File[], options?: { folderMap?: Map<string, string> }) => {
      files.forEach((file) => {
        const id = crypto.randomUUID();
        const folderPath = getFolderPath(file);
        const folderId = options?.folderMap?.get(folderPath);
        const upload: UploadItem = {
          id,
          file,
          folderId,
          status: "uploading",
          progress: 0,
        };

        setUploads((prev) => [...prev, upload]);
        startUpload(upload);
      });
    },
    [startUpload],
  );

  const cancelUpload = useCallback((id: string) => {
    const cancel = cancelersRef.current[id];
    if (cancel) {
      cancel();
    } else {
      updateUpload(id, {
        status: "canceled",
        error: "Upload canceled",
      });
    }
  }, [updateUpload]);

  const retryUpload = useCallback(
    (id: string) => {
      const existing = uploadsRef.current.find((upload) => upload.id === id);
      if (!existing) return;

      startUpload({ ...existing, status: "uploading", progress: 0, error: undefined });
    },
    [startUpload],
  );

  const removeUpload = useCallback((id: string) => {
    const cancel = cancelersRef.current[id];
    if (cancel) {
      cancel();
    }

    delete cancelersRef.current[id];
    setUploads((prev) => prev.filter((upload) => upload.id !== id));
  }, []);

  return {
    uploads,
    addFiles,
    cancelUpload,
    retryUpload,
    removeUpload,
  };
};
