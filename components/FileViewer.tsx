"use client";

import { Models } from "node-appwrite";
import { useRouter } from "next/navigation";
import { RxCross2 } from "react-icons/rx";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import { useState, useEffect } from "react";
import { constructFileUrl, buildShareLink } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Props {
  file: Models.Document;
  prevId?: string | null;
  nextId?: string | null;
  onPrev?: () => void;
  onNext?: () => void;
  onClose?: () => void;
  shareToken?: string;
}

const FileViewer = ({
  file,
  prevId,
  nextId,
  onPrev,
  onNext,
  onClose,
  shareToken,
}: Props) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [contentKey, setContentKey] = useState(0);
  const [copyLabel, setCopyLabel] = useState("Copy link");

  const effectiveToken = shareToken ?? (file.shareToken as string | undefined);
  const fileUrl = constructFileUrl(file.bucketField, effectiveToken);
  const shareLink = effectiveToken ? buildShareLink(effectiveToken) : "";

  useEffect(() => {
    // Reset loading state and trigger content animation when file changes
    setIsLoading(false);
    setContentKey((prev) => prev + 1);
    setCopyLabel("Copy link");
  }, [file.$id, shareLink]);

  const handleCopyLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopyLabel("Copied!");
      setTimeout(() => setCopyLabel("Copy link"), 2000);
    } catch (error) {
      console.error("Failed to copy share link", error);
    }
  };

  const handlePrev = async () => {
    if (isLoading) return;
    setIsLoading(true);

    // Small delay for smooth transition
    setTimeout(() => {
      if (onPrev) return onPrev();
      if (prevId) router.push(`/file/${prevId}`);
    }, 150);
  };

  const handleNext = async () => {
    if (isLoading) return;
    setIsLoading(true);

    // Small delay for smooth transition
    setTimeout(() => {
      if (onNext) return onNext();
      if (nextId) router.push(`/file/${nextId}`);
    }, 150);
  };

  const renderContent = () => {
    if (file.type === "image" && file.extension !== "svg") {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={contentKey}
          src={fileUrl}
          alt={file.name}
          className={`max-h-[90vh] max-w-full object-contain transition-all duration-500 ease-out ${
            isLoading ? "opacity-0 scale-95" : "opacity-100 scale-100"
          }`}
          onLoad={() => setIsLoading(false)}
        />
      );
    }

    if (file.type === "video") {
      return (
        <video
          key={contentKey}
          src={fileUrl}
          controls
          className={`max-h-[90vh] max-w-full w-full transition-all duration-500 ease-out ${
            isLoading ? "opacity-0 scale-95" : "opacity-100 scale-100"
          }`}
          onLoadedData={() => setIsLoading(false)}
        />
      );
    }

    if (file.type === "audio") {
      return (
        <audio
          key={contentKey}
          src={fileUrl}
          controls
          className={`w-full max-w-md transition-all duration-500 ease-out ${
            isLoading ? "opacity-0 scale-95" : "opacity-100 scale-100"
          }`}
          onLoadedData={() => setIsLoading(false)}
        />
      );
    }

    return (
      <iframe
        key={contentKey}
        src={fileUrl}
        title={file.name}
        className={`w-full h-full max-w-full max-h-full transition-all duration-500 ease-out ${
          isLoading ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
        onLoad={() => setIsLoading(false)}
      />
    );
  };

  const showPrev = onPrev || prevId;
  const showNext = onNext || nextId;

  return (
    <div className="relative w-full h-full flex flex-col animate-in fade-in duration-300">
      {/* Close button - positioned at the top right, outside the media area */}
      {onClose && (
        <div className="absolute top-4 right-4 z-10 animate-in slide-in-from-top-2 duration-300">
          <button
            onClick={onClose}
            aria-label="Close viewer"
            className="rounded-full bg-black/70 p-2 text-white hover:bg-black/80 hover:scale-110 transition-all duration-200 backdrop-blur-sm"
          >
            <RxCross2 className="size-6" />
          </button>
        </div>
      )}

      {/* Main content area with navigation */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        {/* Previous button - positioned on the left side */}
        {showPrev && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 animate-in slide-in-from-left-2 duration-300">
            <button
              onClick={handlePrev}
              disabled={isLoading}
              aria-label="Previous file"
              className="rounded-full bg-black/70 p-3 text-white hover:bg-black/80 hover:scale-110 transition-all duration-200 shadow-lg backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaAngleLeft className="size-8" />
            </button>
          </div>
        )}

        {/* Media content - centered with minimal padding to avoid overlap */}
        <div className="flex items-center justify-center w-full h-full px-20 py-4">
          <div className="w-full h-full flex items-center justify-center animate-in fade-in zoom-in-95 duration-500 ease-out">
            {renderContent()}
          </div>
        </div>

        {/* Next button - positioned on the right side */}
        {showNext && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 animate-in slide-in-from-right-2 duration-300">
            <button
              onClick={handleNext}
              disabled={isLoading}
              aria-label="Next file"
              className="rounded-full bg-black/70 p-3 text-white hover:bg-black/80 hover:scale-110 transition-all duration-200 shadow-lg backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaAngleRight className="size-8" />
            </button>
          </div>
        )}
      </div>

      {/* Loading overlay for smooth transitions */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}

      {shareLink && (
        <div className="absolute bottom-5 left-1/2 z-10 flex w-full max-w-xl -translate-x-1/2 flex-col items-center gap-2 rounded-2xl bg-black/70 p-3 text-white backdrop-blur-md">
          <p className="text-xs uppercase tracking-wide text-white/70">Share link</p>
          <div className="flex w-full flex-col gap-2 md:flex-row md:items-center">
            <p className="flex-1 truncate text-sm font-medium">{shareLink}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyLink}
              className="whitespace-nowrap"
            >
              {copyLabel}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileViewer;
