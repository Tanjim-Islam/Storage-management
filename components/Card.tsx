"use client";

import { Models } from "node-appwrite";
import Thumbnail from "@/components/Thumbnail";
import { convertFileSize } from "@/lib/utils";
import FormattedDateTime from "@/components/FormattedDateTime";
import ActionDropdown from "@/components/ActionDropdown";
import { useFileViewer } from "@/components/FileViewerProvider";

interface Props {
  file: Models.Document;
  index: number;
}

const Card = ({ file, index }: Props) => {
  const { open } = useFileViewer();

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open file viewer if clicking on the action dropdown
    if ((e.target as HTMLElement).closest("[data-action-dropdown]")) {
      return;
    }
    open(index);
  };

  return (
    <div
      onClick={handleCardClick}
      className="file-card text-left cursor-pointer"
    >
      <div className="flex justify-between">
        <Thumbnail
          type={file.type}
          extension={file.extension}
          url={file.url}
          className="!size-20"
          imageClassName="!size-11"
        />

        <div className="flex flex-col items-end justify-between">
          <div data-action-dropdown>
            <ActionDropdown file={file} />
          </div>
          <p className="body-1">{convertFileSize(file.size)}</p>
        </div>
      </div>

      <div className="file-card-details">
        <p className="subtitle-2 line-clamp-1">{file.name}</p>
        <FormattedDateTime
          date={file.$createdAt}
          className="body-2 text-light-100"
        />
        <p className="caption line-clamp-1 text-light-200">
          By: {file.owner.fullName}
        </p>
      </div>
    </div>
  );
};

export default Card;
