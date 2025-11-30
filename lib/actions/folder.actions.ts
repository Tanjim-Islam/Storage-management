"use server";

import { createAdminClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { ID, Models, Query } from "node-appwrite";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { parseStringify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { getFiles, deleteFile } from "./file.actions";

export const createFolder = async (
  folder: Folder,
  path?: string
): Promise<string> => {
  const { databases } = await createAdminClient();
  try {
    const doc = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.foldersCollectionId,
      ID.unique(), // Generate a unique ID for the document
      folder // Pass folder data directly
    );

    if (path) revalidatePath(path);
    return doc.$id;
  } catch (error) {
    console.error("createFolder: Error creating folder:", error);
    throw new Error("Failed to create folder");
  }
};

export const getFolders = async (sort: string = "$createdAt-desc", limit?: number) => {
  const { databases } = await createAdminClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("User not found");

  const queries = [
    Query.equal("ownerId", [currentUser.$id]),
  ];
  
  // Handle sorting
  if (sort) {
    const [sortBy, orderBy] = sort.split("-");
    queries.push(
      orderBy === "asc" ? Query.orderAsc(sortBy) : Query.orderDesc(sortBy)
    );
  } else {
    // Default sorting
    queries.push(Query.orderDesc("$createdAt"));
  }
  
  if (limit) queries.push(Query.limit(limit));

  const folders = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.foldersCollectionId,
    queries
  );

  if (!folders.total) return parseStringify(folders);

  const folderIds = folders.documents.map((folder) => folder.$id);

  const filesInFolders = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.filesCollectionId,
    [
      Query.or([
        Query.equal("owner", [currentUser.$id]),
        Query.contains("users", [currentUser.email]),
      ]),
      Query.equal("folderId", folderIds),
      Query.limit(5000),
    ]
  );

  const folderSizes = filesInFolders.documents.reduce<Record<string, number>>(
    (acc, file) => {
      const folderId = file.folderId as string | undefined;
      if (!folderId) return acc;

      const fileSize =
        typeof file.size === "number" ? (file.size as number) : 0;

      acc[folderId] = (acc[folderId] || 0) + fileSize;
      return acc;
    },
    {}
  );

  const foldersWithSizes = {
    ...folders,
    documents: folders.documents.map((folder) => ({
      ...folder,
      size: folderSizes[folder.$id] || 0,
    })),
  };

  return parseStringify(foldersWithSizes);
};

export const getFolderById = async (folderId: string) => {
  const { databases } = await createAdminClient();
  try {
    const folder = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.foldersCollectionId,
      folderId
    );
    return parseStringify(folder);
  } catch (error) {
    console.error(error);
    throw new Error("Failed to get folder");
  }
};

export const renameFolder = async ({
  folderId,
  name,
  path,
}: {
  folderId: string;
  name: string;
  path: string;
}) => {
  const { databases } = await createAdminClient();

  try {
    const updatedFolder = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.foldersCollectionId,
      folderId,
      {
        name,
      }
    );

    revalidatePath(path);
    return true;
  } catch (error) {
    console.error("Failed to rename folder:", error);
    return false;
  }
};

export const updateFolderUsers = async ({
  folderId,
  emails,
  path,
}: {
  folderId: string;
  emails: string[];
  path: string;
}) => {
  const { databases } = await createAdminClient();

  try {
    const updatedFolder = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.foldersCollectionId,
      folderId,
      {
        users: emails,
      }
    );

    revalidatePath(path);
    return true;
  } catch (error) {
    console.error("Failed to update folder users:", error);
    return false;
  }
};

export const deleteFolder = async ({
  folderId,
  path,
}: {
  folderId: string;
  path: string;
}) => {
  const { databases } = await createAdminClient();

  try {
    // 1. Get all files in this folder
    const filesInFolder = await getFiles({ folderId, types: [] });
    
    // 2. Delete all files in this folder
    if (filesInFolder && filesInFolder.documents) {
      for (const file of filesInFolder.documents) {
        await deleteFile({
          fileId: file.$id,
          bucketField: file.bucketField,
          path,
        });
      }
    }

    // 3. Delete the folder itself
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.foldersCollectionId,
      folderId
    );

    revalidatePath(path);
    return true;
  } catch (error) {
    console.error("Failed to delete folder:", error);
    return false;
  }
};
