"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { handleFolderUpload } from "@/lib/utils";

interface Props {
  ownerId: string;
  accountId: string;
}

const FolderUploader = ({ ownerId, accountId }: Props) => {
  const { toast } = useToast();
  const path = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploadingFolders, setUploadingFolders] = useState<
    { name: string; id: string; progress: number }[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);

  const resetInput = () => {
    if (inputRef.current) inputRef.current.value = "";
  };

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
      resetInput();
      return;
    }

    // Extract root folder name for display
    const rootFolderName = files[0].webkitRelativePath.split("/")[0];
    const folderId = rootFolderName + "-progress";

    setIsUploading(true);
    setUploadingFolders([{ name: rootFolderName, id: folderId, progress: 0 }]);

    try {
      await handleFolderUpload(Array.from(files), ownerId, accountId, path, {
        onProgress: (uploaded, total) => {
          const percent = Math.round((uploaded / total) * 100);
          setUploadingFolders((prev) =>
            prev.map((folder) =>
              folder.id === folderId ? { ...folder, progress: percent } : folder
            )
          );
        },
      });

      setUploadingFolders((prev) =>
        prev.map((folder) =>
          folder.id === folderId ? { ...folder, progress: 100 } : folder
        )
      );

      toast({ description: "Folder uploaded successfully!" });
    } catch (error) {
      console.error("Error uploading folder:", error);
      toast({ description: "Failed to upload folder. Please try again." });
    } finally {
      setIsUploading(false);
      resetInput();
      setTimeout(() => setUploadingFolders([]), 500);
    }
  };

  return (
    <>
      <input
        id="folder-upload"
        type="file"
        ref={inputRef}
        className="hidden"
        {...({ webkitdirectory: "" } as any)}
        multiple
        onChange={handleChange}
      />
      
      {uploadingFolders.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="uploader-preview-list rounded-2xl">
            <h4 className="h4 text-light-100">Uploading Folder</h4>
            
            <ul className="mt-2">
            {uploadingFolders.map((folder) => (
              <li key={folder.id} className="uploader-preview-item">
                <div className="flex items-center gap-3">
                  <figure className="thumbnail">
                    <Image
                      src="/assets/icons/folder.svg"
                      alt="folder"
                      width={24}
                      height={24}
                      className="size-8 object-contain"
                    />
                  </figure>
                  <div className="preview-item-name">
                    {folder.name}
                    <div className="w-full h-2 bg-light-300 rounded-2xl overflow-hidden mt-1">
                      <div
                        className="h-full bg-brand rounded-2xl transition-[width] duration-200"
                        style={{ width: `${Math.max(folder.progress, 5)}%` }}
                      />
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shad-button-ghost"
                  disabled={isUploading}
                  onClick={() => {
                    setUploadingFolders([]);
                    setIsUploading(false);
                    resetInput();
                  }}
                >
                  <Image
                    src="/assets/icons/remove.svg"
                    alt="Remove"
                    width={24}
                    height={24}
                  />
                </Button>
              </li>
            ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export default FolderUploader;
