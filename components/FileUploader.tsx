"use client";

import React, { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  cn,
  convertFileToUrl,
  getFileType,
  hasFolderStructure,
  handleFolderUpload,
  processDataTransferItems,
} from "@/lib/utils";
import Image from "next/image";
import Thumbnail from "@/components/Thumbnail";
import { MAX_FILE_SIZE } from "@/constants";
import { useToast } from "@/hooks/use-toast";
import { usePathname } from "next/navigation";
import { useUploadManager, type UploadStatus } from "@/hooks/use-upload-manager";

const STATUS_LABELS: Record<UploadStatus, string> = {
  uploading: "Uploading",
  success: "Completed",
  error: "Failed",
  canceled: "Canceled",
};

interface Props {
  ownerId: string;
  accountId: string;
  className?: string;
}

const FileUploader = ({ ownerId, accountId, className }: Props) => {
  const path = usePathname();
  const { toast } = useToast();
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const processFiles = async (filesToProcess: File[]) => {
    try {
      let folderMap: Map<string, string> | undefined;

      if (hasFolderStructure(filesToProcess)) {
        folderMap = await handleFolderUpload(
          filesToProcess,
          ownerId,
          accountId,
          path,
        );
      }

      const validFiles = filesToProcess.filter((file) => {
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

      if (validFiles.length > 0) {
        addFiles(validFiles, { folderMap });
      }
    } catch (error) {
      console.error("Error preparing upload:", error);
      toast({
        description: "Failed to start upload. Please try again.",
        className: "error-toast",
      });
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      try {
        const filesToProcess = await processDataTransferItems(
          e.dataTransfer.items
        );
        if (filesToProcess.length > 0) {
          await processFiles(filesToProcess);
        }
      } catch (error) {
        console.error("Error processing dropped items:", error);
        toast({
          description: "Failed to process dropped items. Please try again.",
          className: "error-toast",
        });
      }
    }
  };

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const filesToProcess = Array.from(selectedFiles);
      await processFiles(filesToProcess);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (
    e: React.MouseEvent<HTMLImageElement, MouseEvent>,
    uploadId: string
  ) => {
    e.stopPropagation();
    removeUpload(uploadId);
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`cursor-pointer ${isDragActive ? "bg-brand/10 border-2 border-dashed border-brand rounded-lg" : ""}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
        aria-label="Upload files"
      />
      <Button
        type="button"
        className={cn("uploader-button", className)}
        onClick={handleButtonClick}
      >
        <Image
          src="/assets/icons/upload.svg"
          alt="upload"
          width={24}
          height={24}
        />{" "}
        <p>Upload File</p>
      </Button>
      {uploads.length > 0 && (
        <ul className="uploader-preview-list">
          <h4 className="h4 text-light-100">Uploading</h4>

          {uploads.map((upload) => {
            const { type, extension } = getFileType(upload.file.name);

            return (
              <li
                key={upload.id}
                className="uploader-preview-item"
              >
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

                  <Image
                    src="/assets/icons/remove.svg"
                    width={24}
                    height={24}
                    alt="Remove"
                    onClick={(e) => {
                      handleRemoveFile(e, upload.id);
                    }}
                    className="cursor-pointer"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default FileUploader;
