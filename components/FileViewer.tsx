"use client";

import { Models } from "node-appwrite";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface Props {
  file: Models.Document;
  prevId?: string | null;
  nextId?: string | null;
  onPrev?: () => void;
  onNext?: () => void;
  onClose?: () => void;
}

const FileViewer = ({ file, prevId, nextId, onPrev, onNext, onClose }: Props) => {
  const router = useRouter();

  const handlePrev = () => {
    if (onPrev) return onPrev();
    if (prevId) router.push(`/file/${prevId}`);
  };

  const handleNext = () => {
    if (onNext) return onNext();
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

  const showPrev = onPrev || prevId;
  const showNext = onNext || nextId;

  return (
    <div className="relative flex items-center justify-center p-4">
      {showPrev && (
        <button
          onClick={handlePrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white"
        >
          <ChevronLeft className="size-6" />
        </button>
      )}
      {renderContent()}
      {showNext && (
        <button
          onClick={handleNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white"
        >
          <ChevronRight className="size-6" />
        </button>
      )}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
        >
          <X className="size-5" />
        </button>
      )}
    </div>
  );
};

export default FileViewer;
