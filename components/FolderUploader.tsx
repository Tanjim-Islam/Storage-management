"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { createFolder } from "@/lib/actions/folder.actions";
import { uploadFile } from "@/lib/actions/file.actions";
import { usePathname } from "next/navigation";
import { ID } from "node-appwrite";
import { Button } from "./ui/button";

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
  const [uploadingFolders, setUploadingFolders] = useState<{ name: string; id: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }
    
    setIsUploading(true);

    const hasRootFiles = Array.from(files).some(
      (f) => !f.webkitRelativePath.includes("/")
    );
    if (hasRootFiles) {
      toast({ description: "Please select a folder" });
      return;
    }

    // Collect all unique folder paths (including nested folders)
    const allFolderPaths = new Set<string>();
    const foldersMap = new Map<string, string>(); // path -> folderId
    
    // Extract root folder name for display
    const rootFolderName = files[0].webkitRelativePath.split('/')[0];
    setUploadingFolders([{ name: rootFolderName, id: ID.unique() }]);

    Array.from(files).forEach((file) => {
      const pathParts = file.webkitRelativePath.split("/");
      // Add all folder paths (excluding the file itself)
      for (let i = 1; i < pathParts.length; i++) {
        const folderPath = pathParts.slice(0, i).join("/");
        allFolderPaths.add(folderPath);
      }
    });

    // Sort folder paths to ensure parent folders are created before children
    const sortedFolderPaths = Array.from(allFolderPaths).sort();

    try {
      // Create folders first
      for (const folderPath of sortedFolderPaths) {
        const pathParts = folderPath.split("/");
        const folderName = pathParts[pathParts.length - 1];

        const folderResult = await createFolder(
          {
            name: folderName,
            ownerId,
            accountId,
          },
          path
        );

        foldersMap.set(folderPath, folderResult);
      }

      // Upload files and associate them with their folders
      const uploadPromises = Array.from(files).map(async (file) => {
        const pathParts = file.webkitRelativePath.split("/");
        const folderPath = pathParts.slice(0, -1).join("/");
        const folderId = foldersMap.get(folderPath);

        return uploadFile({
          file,
          ownerId,
          accountId,
          folderId,
          path,
        });
      });

      await Promise.all(uploadPromises);

      toast({ description: "Folder uploaded successfully!" });
      setIsUploading(false);
      setUploadingFolders([]);
    } catch (error) {
      console.error("Error uploading folder:", error);
      toast({ description: "Failed to upload folder. Please try again." });
      setIsUploading(false);
      setUploadingFolders([]);
    }
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
      
      {uploadingFolders.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="uploader-preview-list rounded-2xl overflow-hidden">
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
                    <div className="w-full h-1.5 bg-gray-200 rounded-2xl overflow-hidden mt-1">
                      <div className="h-full bg-blue-400 rounded-2xl animate-pulse w-full"></div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shad-button-ghost"
                  onClick={() => {
                    setUploadingFolders([]);
                    setIsUploading(false);
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
