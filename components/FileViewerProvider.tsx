"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { Models } from "node-appwrite";
import FileViewer from "@/components/FileViewer";

interface Context {
  open: (index: number) => void;
}

const FileViewerContext = createContext<Context | null>(null);

export const FileViewerProvider = ({
  files,
  children,
}: {
  files: Models.Document[];
  children: React.ReactNode;
}) => {
  const [index, setIndex] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const close = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsVisible(false);
    // Wait for exit animation to complete before removing from DOM
    setTimeout(() => {
      setIndex(null);
      setIsAnimating(false);
    }, 300);
  };

  const open = (i: number) => {
    if (isAnimating) return;
    setIndex(i);
    setIsAnimating(true);
    // Small delay to ensure DOM is ready before showing animation
    requestAnimationFrame(() => {
      setIsVisible(true);
      setTimeout(() => setIsAnimating(false), 300);
    });
  };

  const prev = () => {
    if (isAnimating) return;
    setIndex((i) => (i !== null && i > 0 ? i - 1 : i));
  };

  const next = () => {
    if (isAnimating) return;
    setIndex((i) => (i !== null && i < files.length - 1 ? i + 1 : i));
  };

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && index !== null) {
        close();
      }
    };

    if (index !== null) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden"; // Prevent background scroll
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [index]);

  return (
    <FileViewerContext.Provider value={{ open }}>
      {children}
      {index !== null && (
        <div
          className={`fixed inset-0 z-50 transition-all duration-300 ease-out ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Background overlay - clicking closes the modal */}
          <div
            className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-all duration-300 ease-out ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
            onClick={close}
            aria-hidden="true"
          />

          {/* Modal content */}
          <div
            className={`absolute inset-0 flex items-center justify-center p-4 transition-all duration-300 ease-out ${
              isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full h-full max-w-7xl max-h-full">
              <FileViewer
                file={files[index]}
                onPrev={index > 0 ? prev : undefined}
                onNext={index < files.length - 1 ? next : undefined}
                onClose={close}
              />
            </div>
          </div>
        </div>
      )}
    </FileViewerContext.Provider>
  );
};

export const useFileViewer = () => {
  const ctx = useContext(FileViewerContext);
  if (!ctx)
    throw new Error("useFileViewer must be used within FileViewerProvider");
  return ctx;
};
