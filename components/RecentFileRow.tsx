"use client";

import { Models } from "node-appwrite";
import { useFileViewer } from "@/components/FileViewerProvider";
import Thumbnail from "@/components/Thumbnail";
import FormattedDateTime from "@/components/FormattedDateTime";
import ActionDropdown from "@/components/ActionDropdown";

const RecentFileRow = ({ file, index }: { file: Models.Document; index: number }) => {
  const { open } = useFileViewer();

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => open(index)}
        className="flex flex-1 items-center gap-3 text-left"
      >
        <Thumbnail type={file.type} extension={file.extension} url={file.url} />
        <div className="flex flex-col gap-1">
          <p className="recent-file-name">{file.name}</p>
          <FormattedDateTime date={file.$createdAt} className="caption" />
        </div>
      </button>
      <ActionDropdown file={file} />
    </div>
  );
};

export default RecentFileRow;
