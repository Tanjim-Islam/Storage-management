"use server";

import Fuse from "fuse.js";
import { Models, Query } from "node-appwrite";

import { createAdminClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { parseStringify } from "@/lib/utils";

type SearchHit = {
  kind: "file" | "folder";
  item: Models.Document;
  score?: number;
};

export const searchResources = async ({
  query,
  limit = 12,
}: {
  query: string;
  limit?: number;
}) => {
  const cleanedQuery = query.trim();
  if (!cleanedQuery) return { results: [], suggestions: [] };

  // Appwrite caps limit at 100 per page; fetch everything with pagination.
  const safeLimit = Math.max(limit, 1);

  const { databases } = await createAdminClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("User not found");

  const fetchAll = async (
    collectionId: string,
    baseQueries: (ReturnType<typeof Query.equal> | ReturnType<typeof Query.or>)[],
  ) => {
    const pageLimit = 100;
    const all: Models.Document[] = [];
    let cursor: string | undefined;

    while (true) {
      const page = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        [
          ...baseQueries,
          Query.limit(pageLimit),
          ...(cursor ? [Query.cursorAfter(cursor)] : []),
        ],
      );

      all.push(...page.documents);

      if (page.documents.length < pageLimit) break;
      cursor = page.documents[page.documents.length - 1].$id;
    }

    return all;
  };

  const files = await fetchAll(appwriteConfig.filesCollectionId, [
    Query.or([
      Query.equal("owner", [currentUser.$id]),
      Query.contains("users", [currentUser.email]),
    ]),
  ]);

  const folders = await fetchAll(appwriteConfig.foldersCollectionId, [
    Query.equal("ownerId", [currentUser.$id]),
  ]);

  const searchableItems: { name: string; kind: "file" | "folder"; item: Models.Document }[] = [
    ...files.map((file) => ({
      name: file.name as string,
      kind: "file" as const,
      item: file,
    })),
    ...folders.map((folder) => ({
      name: folder.name as string,
      kind: "folder" as const,
      item: folder,
    })),
  ];

  const fuse = new Fuse(searchableItems, {
    keys: ["name"],
    includeScore: true,
    threshold: 0.45,
    ignoreLocation: true,
    distance: 150,
  });

  const matches = fuse.search(cleanedQuery, {
    limit: Math.max(safeLimit * 3, 50),
  });

  const results: SearchHit[] = matches.slice(0, safeLimit).map((match) => ({
    kind: match.item.kind,
    item: match.item.item,
    score: match.score ?? 0,
  }));

  const suggestions = Array.from(
    new Set(matches.slice(0, 8).map((match) => match.item.name)),
  );

  return parseStringify({
    results,
    suggestions,
  });
};
