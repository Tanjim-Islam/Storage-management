"use client";

import React, { useEffect, useState } from "react";

import Image from "next/image";
import { Input } from "@/components/ui/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { searchResources } from "@/lib/actions/search.actions";
import { Models } from "node-appwrite";
import Thumbnail from "@/components/Thumbnail";
import FormattedDateTime from "@/components/FormattedDateTime";
import { useDebounce } from "use-debounce";
import { X } from "lucide-react";

type SearchResult = {
  kind: "file" | "folder";
  item: Models.Document;
  score?: number;
};

const Search = () => {
  const [query, setQuery] = useState("");
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("query") || "";
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const path = usePathname();
  const [debouncedQuery] = useDebounce(query, 300);

  useEffect(() => {
    const fetchFiles = async () => {
      if (debouncedQuery.trim().length === 0) {
        setResults([]);
        setOpen(false);
        return router.replace(path);
      }

      const { results, suggestions } = await searchResources({
        query: debouncedQuery,
      });
      setResults(results);
      setSuggestions(suggestions);
      setOpen(true);
    };

    fetchFiles();
  }, [debouncedQuery, path, router]);

  useEffect(() => {
    if (!searchQuery) {
      setQuery("");
    }
  }, [searchQuery]);

  const handleClickItem = (result: SearchResult) => {
    setOpen(false);
    setResults([]);

    const canonicalName = (result.item.name as string) || query;
    setQuery(canonicalName);

    if (result.kind === "folder") {
      router.push(`/folders/${result.item.$id}?query=${encodeURIComponent(canonicalName)}`);
      return;
    }

    const file = result.item;
    const targetQuery = encodeURIComponent(canonicalName);

    if (file.folderId) {
      router.push(`/folders/${file.folderId}?query=${targetQuery}`);
      return;
    }

    const type =
      file.type === "video" || file.type === "audio"
        ? "media"
        : `${file.type}s`;

    router.push(`/${type}?query=${targetQuery}`);
  };

  const handleSuggestionClick = (value: string) => {
    setQuery(value);
    setOpen(true);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setSuggestions([]);
    setOpen(false);
    router.replace(path);
  };

  return (
    <div className="search">
      <div className="search-input-wrapper">
        <Image
          src="/assets/icons/search.svg"
          alt="Search"
          width={24}
          height={24}
        />
        <Input
          value={query}
          placeholder="Search..."
          className="search-input"
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-light-200 transition hover:text-light-100 focus:outline-none"
            onClick={handleClear}
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        )}

        {open && (
          <ul className="search-result">
            {results.length > 0 ? (
              results.map((result) => {
                const isFolder = result.kind === "folder";
                const doc = result.item;
                return (
                  <li
                    className="flex items-center justify-between"
                    key={doc.$id}
                    onClick={() => handleClickItem(result)}
                  >
                    <div className="flex cursor-pointer items-center gap-4">
                      {isFolder ? (
                        <span className="folder-thumb size-9 min-w-9 flex items-center justify-center rounded-lg bg-primary/10">
                          <Image
                            src="/assets/icons/folder.svg"
                            alt="folder"
                            width={24}
                            height={24}
                          />
                        </span>
                      ) : (
                        <Thumbnail
                          type={doc.type}
                          extension={doc.extension}
                          url={doc.url}
                          className="size-9 min-w-9"
                        />
                      )}
                      <div className="flex flex-col gap-1">
                        <p className="search-result-name subtitle-2 line-clamp-1 text-light-100">
                          {doc.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-light-200 caption">
                          <span className="uppercase tracking-wide">
                            {isFolder ? "Folder" : doc.type}
                          </span>
                          <span className="text-light-300">•</span>
                          <FormattedDateTime
                            date={doc.$createdAt}
                            className="caption line-clamp-1 text-light-200"
                          />
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })
            ) : suggestions.length > 0 ? (
              <div className="flex flex-col gap-2 p-3">
                <p className="caption text-light-200">Did you mean:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary hover:bg-primary/20"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="empty-result">No results found</p>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Search;
