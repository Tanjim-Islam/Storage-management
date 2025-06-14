"use client";

import React, { useCallback, useState } from "react";
import Image from "next/image";
import Thumbnail from "@/components/Thumbnail";
import {
  convertFileToUrl,
  getFileType,
  hasFolderStructure,
  handleFolderUpload,
  processDataTransferItems,
} from "@/lib/utils";
import { uploadFile } from "@/lib/actions/file.actions";
import { useToast } from "@/hooks/use-toast";
import { MAX_FILE_SIZE } from "@/constants";
import { usePathname } from "next/navigation";

interface PageDropzoneProps {
  ownerId: string;
  accountId: string;
  children: React.ReactNode;
}

const PageDropzone = ({ ownerId, accountId, children }: PageDropzoneProps) => {
  const path = usePathname();
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);

  const processFiles = async (filesToProcess: File[]) => {
    try {
      setFiles(filesToProcess);

      // Check if any files have folder structure
      if (hasFolderStructure(filesToProcess)) {
        // Handle as folder upload
        await handleFolderUpload(filesToProcess, ownerId, accountId, path);
        toast({ description: "Folder uploaded successfully!" });
      } else {
        // Handle as individual file uploads
        const uploadPromises = filesToProcess.map(async (file) => {
          if (file.size > MAX_FILE_SIZE) {
            setFiles((prevFiles) =>
              prevFiles.filter((f) => f.name !== file.name)
            );

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
                setFiles((prevFiles) =>
                  prevFiles.filter((f) => f.name !== file.name)
                );
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
    } finally {
      // Clear files after upload
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
    // Only set to false if we're leaving the dropzone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragActive(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    console.log("PageDropzone: Drop event triggered");
    console.log("PageDropzone: DataTransfer items:", e.dataTransfer.items);

    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      try {
        const filesToProcess = await processDataTransferItems(
          e.dataTransfer.items
        );
        console.log("PageDropzone: Processed files:", filesToProcess);
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

  const handleRemoveFile = (
    e: React.MouseEvent<HTMLImageElement, MouseEvent>,
    fileName: string
  ) => {
    e.stopPropagation();
    setFiles((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
  };

  return (
    <div
      className="dropzone-wrapper"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDragActive && (
        <div className="dropzone-overlay">
          <Image
            src="/assets/icons/upload.svg"
            alt="upload"
            width={40}
            height={40}
          />
          <p className="h3 text-white">Drop files or folders to upload</p>
        </div>
      )}
      {children}
      {files.length > 0 && (
        <ul className="uploader-preview-list">
          <h4 className="h4 text-light-100">Uploading</h4>

          {files.map((file, index) => {
            const { type, extension } = getFileType(file.name);

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
                    <Image
                      src="/assets/icons/file-loader.gif"
                      width={80}
                      height={26}
                      alt="Loader"
                    />
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

export default PageDropzone;
