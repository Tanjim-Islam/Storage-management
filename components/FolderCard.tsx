"use client";

import Image from "next/image";
import Link from "next/link";
import { Models } from "node-appwrite";
import FolderActionDropdown from "./FolderActionDropdown";
import { usePathname } from "next/navigation";
import { convertFileSize } from "@/lib/utils";

const FolderCard = ({
  folder,
  selectionEnabled = false,
  selected = false,
  onToggleSelect,
}: {
  folder: Models.Document & { size?: number };
  selectionEnabled?: boolean;
  selected?: boolean;
  onToggleSelect?: (folderId: string) => void;
}) => {
  const pathname = usePathname();
  const isOnFoldersPage = pathname === "/folders";
  
  return (
    <div className={`relative flex items-center gap-3 pl-4 transition-transform duration-200 hover:-translate-y-1 ${isOnFoldersPage ? 'border rounded-2xl shadow-sm hover:shadow-lg p-2 transition-all duration-300' : ''} ${selected ? "ring-2 ring-brand/50" : ""}`}>
      {selectionEnabled && (
        <label
          data-selection-checkbox
          className="absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect?.(folder.$id)}
            className="selection-checkbox"
          />
        </label>
      )}
      <Link
        href={`/folders/${folder.$id}`}
        className="flex flex-1 items-center gap-3 text-left"
      >
        <span className="folder-thumb">
          <Image
            src="/assets/icons/folder.svg"
            alt="folder"
            width={24}
            height={24}
          />
        </span>
        <div className="flex flex-1 flex-col">
          <p className="subtitle-2 line-clamp-1">{folder.name}</p>
          <p className="caption text-light-200">
            Size: {convertFileSize(Number(folder.size) || 0)}
          </p>
        </div>
      </Link>
      <FolderActionDropdown folder={folder} />
    </div>
  );
};
export default FolderCard;
