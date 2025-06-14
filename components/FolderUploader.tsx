"use client";

import React from "react";
import { useToast } from "@/hooks/use-toast";
import { createFolder } from "@/lib/actions/folder.actions";
import { uploadFile } from "@/lib/actions/file.actions";
import { usePathname } from "next/navigation";
import { ID } from "node-appwrite";

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
      return;
    }

    // Collect all unique folder paths (including nested folders)
    const allFolderPaths = new Set<string>();
    const foldersMap = new Map<string, string>(); // path -> folderId

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
    } catch (error) {
      console.error("Error uploading folder:", error);
      toast({ description: "Failed to upload folder. Please try again." });
    }
  };

  return (
    <input
      id="folder-upload"
      type="file"
      className="hidden"
      {...({ webkitdirectory: "" } as any)}
      multiple
      onChange={handleChange}
    />
  );
};

export default FolderUploader;
