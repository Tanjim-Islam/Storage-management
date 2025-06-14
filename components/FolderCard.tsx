"use client";

import Image from "next/image";
import Link from "next/link";
import { Models } from "node-appwrite";

const FolderCard = ({ folder }: { folder: Models.Document }) => {
  return (
    <Link href={`/folders/${folder.$id}`} className="file-card text-left">
      <div className="flex items-center gap-3">
        <span className="folder-thumb">
          <Image
            src="/assets/icons/folder.svg"
            alt="folder"
            width={24}
            height={24}
          />
        </span>
        <p className="subtitle-2 line-clamp-1 flex-1">{folder.name}</p>
      </div>
    </Link>
  );
};
export default FolderCard;
