"use client";

import { Models } from "node-appwrite";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  file: Models.Document;
  prevId?: string | null;
  nextId?: string | null;
}

const FileViewer = ({ file, prevId, nextId }: Props) => {
  const router = useRouter();

  const handlePrev = () => {
    if (prevId) router.push(`/file/${prevId}`);
  };

  const handleNext = () => {
    if (nextId) router.push(`/file/${nextId}`);
  };

  const renderContent = () => {
    if (file.type === "image" && file.extension !== "svg") {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={file.url} alt={file.name} className="max-h-[80vh] mx-auto" />
      );
    }

    if (file.type === "video") {
      return (
        <video src={file.url} controls className="max-h-[80vh] mx-auto" />
      );
    }

    if (file.type === "audio") {
      return <audio src={file.url} controls className="mx-auto" />;
    }

    return <iframe src={file.url} className="w-full h-[80vh]" />;
  };

  return (
    <div className="relative flex items-center justify-center p-4">
      {prevId && (
        <button
          onClick={handlePrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white"
        >
          <ChevronLeft className="size-6" />
        </button>
      )}
      {renderContent()}
      {nextId && (
        <button
          onClick={handleNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white"
        >
          <ChevronRight className="size-6" />
        </button>
      )}
    </div>
  );
};

export default FileViewer;
