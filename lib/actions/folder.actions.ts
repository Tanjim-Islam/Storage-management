"use server";

import { createAdminClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { ID, Models, Query } from "node-appwrite";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { parseStringify } from "@/lib/utils";

export const createFolder = async (folder: Folder): Promise<string> => {
  const { databases } = await createAdminClient();
  try {
    const doc = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.foldersCollectionId,
      folder.id,
      folder
    );
    return doc.$id;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to create folder");
  }
};

export const getFolders = async (limit?: number) => {
  const { databases } = await createAdminClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("User not found");

  const queries = [
    Query.equal("ownerId", [currentUser.$id]),
    Query.orderDesc("$createdAt"),
  ];
  if (limit) queries.push(Query.limit(limit));

  const folders = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.foldersCollectionId,
    queries
  );

  return parseStringify(folders);
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
