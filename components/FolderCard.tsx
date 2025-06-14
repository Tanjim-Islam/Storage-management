"use client";

import Image from "next/image";
import Link from "next/link";
import { Models } from "node-appwrite";
import FolderActionDropdown from "./FolderActionDropdown";
import { usePathname } from "next/navigation";

const FolderCard = ({ folder }: { folder: Models.Document }) => {
  const pathname = usePathname();
  const isOnFoldersPage = pathname === "/folders";
  
  return (
    <div className={`flex items-center gap-3 pl-4 transition-transform duration-200 hover:-translate-y-1 ${isOnFoldersPage ? 'border rounded-2xl shadow-sm hover:shadow-lg p-2 transition-all duration-300' : ''}`}>
      <Link href={`/folders/${folder.$id}`} className="flex flex-1 items-center gap-3 text-left">
        <span className="folder-thumb">
          <Image
            src="/assets/icons/folder.svg"
            alt="folder"
            width={24}
            height={24}
          />
        </span>
        <p className="subtitle-2 line-clamp-1 flex-1">{folder.name}</p>
      </Link>
      <FolderActionDropdown folder={folder} />
    </div>
  );
};
export default FolderCard;
