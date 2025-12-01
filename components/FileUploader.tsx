"use client";

import React, { useRef, useState } from "react";
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
import { uploadFile } from "@/lib/actions/file.actions";
import { usePathname } from "next/navigation";

interface Props {
  ownerId: string;
  accountId: string;
  className?: string;
}

const FileUploader = ({ ownerId, accountId, className }: Props) => {
  const path = usePathname();
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressTimers = useRef<
    Record<string, ReturnType<typeof setInterval>>
  >({});

  const getFileId = (file: File) =>
    `${file.name}-${file.size}-${file.lastModified}`;

  const resetProgress = () => {
    Object.values(progressTimers.current).forEach(clearInterval);
    progressTimers.current = {};
    setProgressMap({});
  };

  const startProgress = (id: string) => {
    if (progressTimers.current[id]) clearInterval(progressTimers.current[id]);

    setProgressMap((prev) => ({ ...prev, [id]: 8 }));

    progressTimers.current[id] = setInterval(() => {
      setProgressMap((prev) => {
        const current = prev[id] ?? 8;
        const next = Math.min(current + 6, 92);
        return { ...prev, [id]: next };
      });
    }, 200);
  };

  const completeProgress = (id: string) => {
    if (progressTimers.current[id]) {
      clearInterval(progressTimers.current[id]);
      delete progressTimers.current[id];
    }

    setProgressMap((prev) => ({ ...prev, [id]: 100 }));
    setTimeout(() => {
      setProgressMap((prev) => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
    }, 400);
  };

  const clearProgress = (id: string) => {
    if (progressTimers.current[id]) {
      clearInterval(progressTimers.current[id]);
      delete progressTimers.current[id];
    }
    setProgressMap((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  };

  const processFiles = async (filesToProcess: File[]) => {
    try {
      setFiles(filesToProcess);
      filesToProcess.forEach((file) => startProgress(getFileId(file)));

      // Check if any files have folder structure
      if (hasFolderStructure(filesToProcess)) {
        // Handle as folder upload
        await handleFolderUpload(filesToProcess, ownerId, accountId, path, {
          onFileUploaded: (uploadedFile) => {
            const id = getFileId(uploadedFile);
            completeProgress(id);
            setFiles((prevFiles) =>
              prevFiles.filter((file) => getFileId(file) !== id)
            );
          },
        });
        toast({ description: "Folder uploaded successfully!" });
      } else {
        // Handle as individual file uploads
        const uploadPromises = filesToProcess.map(async (file) => {
          const id = getFileId(file);

          if (file.size > MAX_FILE_SIZE) {
            setFiles((prevFiles) =>
              prevFiles.filter((f) => f.name !== file.name)
            );
            clearProgress(id);

            return toast({
              description: (
                <p className="body-2 text-white">
                  <span className="font-semibold">{file.name}</span> is too
                  large. Max file size is 50MB.
                </p>
              ),
              className: "error-toast",
            });
          }

          return uploadFile({ file, ownerId, accountId, path }).then(
            (uploadedFile) => {
              if (uploadedFile) {
                completeProgress(id);
                setFiles((prevFiles) =>
                  prevFiles.filter((f) => f.name !== file.name)
                );
              } else {
                clearProgress(id);
              }
            }
          );
        });

        await Promise.all(uploadPromises);
      }
    } catch (error) {
      console.error("Error uploading:", error);
      toast({
        description: "Failed to upload. Please try again.",
        className: "error-toast",
      });
      resetProgress();
    } finally {
      // Clear files after upload
      resetProgress();
      setFiles([]);
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

    console.log("Drop event triggered");
    console.log("DataTransfer items:", e.dataTransfer.items);

    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      try {
        const filesToProcess = await processDataTransferItems(
          e.dataTransfer.items
        );
        console.log("Processed files:", filesToProcess);
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
    fileName: string
  ) => {
    e.stopPropagation();
    const file = files.find((f) => f.name === fileName);
    if (file) {
      clearProgress(getFileId(file));
    }
    setFiles((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
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
      {files.length > 0 && (
        <ul className="uploader-preview-list">
          <h4 className="h4 text-light-100">Uploading</h4>

          {files.map((file, index) => {
            const { type, extension } = getFileType(file.name);
            const progress = progressMap[getFileId(file)] ?? 8;

            return (
              <li
                key={`${file.name}-${index}`}
                className="uploader-preview-item"
              >
                <div className="flex items-center gap-3">
                  <Thumbnail
                    type={type}
                    extension={extension}
                    url={convertFileToUrl(file)}
                  />

                  <div className="preview-item-name">
                    {file.name}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-2 w-40 overflow-hidden rounded-full bg-rose-100">
                        <div
                          className="h-full rounded-full bg-rose-300 transition-[width] duration-200"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <span className="caption text-light-200">
                        {Math.min(Math.round(progress), 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                <Image
                  src="/assets/icons/remove.svg"
                  width={24}
                  height={24}
                  alt="Remove"
                  onClick={(e) => handleRemoveFile(e, file.name)}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default FileUploader;
