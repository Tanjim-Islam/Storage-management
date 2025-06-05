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

const FileViewer = ({
  file,
  prevId,
  nextId,
  onPrev,
  onNext,
  onClose,
}: Props) => {
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
        <img
          src={file.url}
          alt={file.name}
          className="max-h-[80vh] max-w-full object-contain"
        />
      );
    }

    if (file.type === "video") {
      return (
        <video src={file.url} controls className="max-h-[80vh] max-w-full" />
      );
    }

    if (file.type === "audio") {
      return <audio src={file.url} controls className="w-full max-w-md" />;
    }

    return (
      <iframe
        src={file.url}
        title={file.name}
        className="w-full h-[80vh] max-w-4xl"
      />
    );
  };

  const showPrev = onPrev || prevId;
  const showNext = onNext || nextId;

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Close button - positioned at the top right, outside the media area */}
      {onClose && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={onClose}
            aria-label="Close viewer"
            className="rounded-full bg-black/70 p-2 text-white hover:bg-black/80 transition-colors"
          >
            <X className="size-6" />
          </button>
        </div>
      )}

      {/* Main content area with navigation */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        {/* Previous button - positioned on the left side */}
        {showPrev && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
            <button
              onClick={handlePrev}
              aria-label="Previous file"
              className="rounded-full bg-black/70 p-3 text-white hover:bg-black/80 transition-colors shadow-lg"
            >
              <ChevronLeft className="size-8" />
            </button>
          </div>
        )}

        {/* Media content - centered with padding to avoid overlap */}
        <div className="flex items-center justify-center w-full h-full px-16 py-12 sm:px-20 sm:py-16">
          {renderContent()}
        </div>

        {/* Next button - positioned on the right side */}
        {showNext && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
            <button
              onClick={handleNext}
              aria-label="Next file"
              className="rounded-full bg-black/70 p-3 text-white hover:bg-black/80 transition-colors shadow-lg"
            >
              <ChevronRight className="size-8" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileViewer;
