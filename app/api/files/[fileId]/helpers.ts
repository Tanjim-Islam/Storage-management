import { createAdminClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { Query } from "node-appwrite";

const extractOwnerId = (owner: any): string | null => {
  if (!owner) return null;

  if (typeof owner === "string") return owner;

  if (typeof owner === "object") {
    if (typeof owner.$id === "string") return owner.$id;
    if (typeof owner.ownerId === "string") return owner.ownerId;
    if (typeof owner.accountId === "string") return owner.accountId;
  }

  return null;
};

export const buildAppwriteUrl = (fileId: string, mode: "view" | "download") => {
  return `${appwriteConfig.endpointUrl}/storage/buckets/${appwriteConfig.bucketId}/files/${fileId}/${mode}?project=${appwriteConfig.projectId}`;
};

interface AuthorizationResult {
  authorized: boolean;
  status?: number;
  message?: string;
  file?: any;
}

export const authorizeFileAccess = async (
  fileId: string,
  token?: string | null,
): Promise<AuthorizationResult> => {
  const { databases } = await createAdminClient();

  const files = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.filesCollectionId,
    [Query.equal("bucketField", [fileId]), Query.limit(1)],
  );

  if (files.total === 0) {
    return { authorized: false, status: 404, message: "File not found" };
  }

  const file = files.documents[0];

  let currentUser = null;
  try {
    currentUser = await getCurrentUser();
  } catch (error) {
    currentUser = null;
  }

  const ownerId = extractOwnerId(file.owner);
  const sharedEmails = Array.isArray(file.sharedEmails)
    ? file.sharedEmails
    : Array.isArray(file.users)
      ? file.users
      : [];

  const isOwner = currentUser && ownerId && ownerId === currentUser.$id;
  const isSharedUser = currentUser && sharedEmails.includes(currentUser.email);

  const hasValidToken =
    !!token &&
    file.isPublic &&
    file.shareToken === token &&
    (!file.shareExpiresAt || new Date(file.shareExpiresAt) > new Date());

  if (!isOwner && !isSharedUser && !hasValidToken) {
    return { authorized: false, status: 403, message: "Unauthorized" };
  }

  return { authorized: true, file };
};
