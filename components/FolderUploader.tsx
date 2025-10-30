"use client";

import React, { useCallback } from "react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import {
  useUploadManager,
  type UploadStatus,
} from "@/hooks/use-upload-manager";
import { convertFileToUrl, getFileType, handleFolderUpload } from "@/lib/utils";
import { MAX_FILE_SIZE } from "@/constants";
import Thumbnail from "./Thumbnail";

const STATUS_LABELS: Record<UploadStatus, string> = {
  uploading: "Uploading",
  success: "Completed",
  error: "Failed",
  canceled: "Canceled",
};

interface Props {
  ownerId: string;
  accountId: string;
}

interface DirectoryInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  webkitdirectory?: string;
  directory?: string;
}

const FolderUploader = ({ ownerId, accountId }: Props) => {
  const { toast } = useToast();
  const path = usePathname();

  const notifyError = useCallback(
    (message: string) => {
      toast({
        description: (
          <p className="body-2 text-white">
            {message}
          </p>
        ),
        className: "error-toast",
      });
    },
    [toast],
  );

  const { uploads, addFiles, cancelUpload, retryUpload, removeUpload } =
    useUploadManager({
      ownerId,
      accountId,
      path,
      notifyError,
    });

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const hasRootFiles = Array.from(files).some(
      (f) => !f.webkitRelativePath.includes("/")
    );
    if (hasRootFiles) {
      toast({ description: "Please select a folder" });
      e.target.value = "";
      return;
    }

    try {
      const fileList = Array.from(files);

      const validFiles = fileList.filter((file) => {
        if (file.size > MAX_FILE_SIZE) {
          toast({
            description: (
              <p className="body-2 text-white">
                <span className="font-semibold">{file.name}</span> is too
                large. Max file size is 50MB.
              </p>
            ),
            className: "error-toast",
          });
          return false;
        }

        return true;
      });

      if (validFiles.length === 0) {
        e.target.value = "";
        return;
      }

      const foldersMap = await handleFolderUpload(
        validFiles,
        ownerId,
        accountId,
        path,
      );

      addFiles(validFiles, { folderMap: foldersMap });
    } catch (error) {
      console.error("Error uploading folder:", error);
      toast({ description: "Failed to upload folder. Please try again." });
    }

    e.target.value = "";
  };

  return (
    <>
      <input
        id="folder-upload"
        type="file"
        className="hidden"
        {...({ webkitdirectory: "" } as any)}
        multiple
        onChange={handleChange}
      />
      {uploads.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="uploader-preview-list rounded-2xl overflow-hidden">
            <h4 className="h4 text-light-100">Uploading Folder</h4>

            <ul className="mt-2">
              {uploads.map((upload) => {
                const { type, extension } = getFileType(upload.file.name);

                return (
                  <li key={upload.id} className="uploader-preview-item">
                    <div className="flex items-center gap-3">
                      <Thumbnail
                        type={type}
                        extension={extension}
                        url={convertFileToUrl(upload.file)}
                      />
                      <div className="preview-item-name">
                        <p>{upload.file.name}</p>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-1.5 bg-dark-600 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand transition-all"
                              style={{ width: `${upload.progress}%` }}
                            />
                          </div>
                          <span className="body-3 text-light-300">
                            {upload.progress}%
                          </span>
                        </div>
                        <p className="body-3 text-light-300">
                          {upload.error
                            ? upload.error
                            : STATUS_LABELS[upload.status]}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {upload.status === "uploading" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shad-button-ghost px-2"
                          onClick={() => cancelUpload(upload.id)}
                        >
                          Cancel
                        </Button>
                      )}

                      {(upload.status === "error" ||
                        upload.status === "canceled") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shad-button-ghost px-2"
                          onClick={() => retryUpload(upload.id)}
                        >
                          Retry
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        className="shad-button-ghost"
                        onClick={() => removeUpload(upload.id)}
                      >
                        <Image
                          src="/assets/icons/remove.svg"
                          alt="Remove"
                          width={24}
                          height={24}
                        />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export default FolderUploader;
