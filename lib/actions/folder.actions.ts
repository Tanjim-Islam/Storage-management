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
    throw new Error(
      "We couldn't create that folder because the storage service is unavailable. Please retry shortly.",
    );
  }
};

const emptyFolderList = () =>
  parseStringify({
    documents: [],
    total: 0,
  });

export const getFolders = async (sort: string = "$createdAt-desc", limit?: number) => {
  const { databases } = await createAdminClient();

  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      console.warn("getFolders: No authenticated user found");
      return emptyFolderList();
    }

    const queries = [Query.equal("ownerId", [currentUser.$id])];

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

    return parseStringify(folders);
  } catch (error) {
    console.error("Failed to get folders", error);
    return emptyFolderList();
  }
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
    console.error("Failed to get folder", error);
    return null;
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
