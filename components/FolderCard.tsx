"use client";

import Image from "next/image";
import Link from "next/link";
import { Models } from "node-appwrite";
import FolderActionDropdown from "./FolderActionDropdown";

const FolderCard = ({ folder }: { folder: Models.Document }) => {
  return (
    <div className="flex items-center gap-3 pl-4">
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
