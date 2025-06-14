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

interface DirectoryInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  webkitdirectory?: string;
  directory?: string;
}

const FolderUploader = ({ ownerId, accountId }: Props) => {
  const { toast } = useToast();
  const path = usePathname();

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const hasRootFiles = Array.from(files).some(
      (f) => !f.webkitRelativePath.includes("/")
    );
    if (hasRootFiles) {
      toast({ description: "Please select a folder" });
      return;
    }

    const foldersMap = new Map<string, File[]>();
    Array.from(files).forEach((file) => {
      const parts = file.webkitRelativePath.split("/");
      const top = parts[0];
      if (!foldersMap.has(top)) foldersMap.set(top, []);
      foldersMap.get(top)!.push(file);
    });

    for (const [name, group] of foldersMap.entries()) {
      const folderId = ID.unique();
      await createFolder({
        id: folderId,
        name,
        ownerId,
        createdAt: new Date().toISOString(),
      });
      for (const file of group) {
        await uploadFile({
          file,
          ownerId,
          accountId,
          folderId,
          path,
        });
      }
    }

    e.target.value = "";
  };

  return (
    <input
      type="file"
      {...({
        webkitdirectory: "true",
        directory: "true",
      } as DirectoryInputProps)}
      multiple
      className="hidden"
      onChange={handleChange}
      id="folder-upload"
      aria-label="Upload folder"
    />
  );
};

export default FolderUploader;
