"use client";

import { createContext, useContext, useState } from "react";
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

  const close = () => setIndex(null);
  const open = (i: number) => setIndex(i);
  const prev = () => setIndex((i) => (i !== null && i > 0 ? i - 1 : i));
  const next = () =>
    setIndex((i) => (i !== null && i < files.length - 1 ? i + 1 : i));

  return (
    <FileViewerContext.Provider value={{ open }}>
      {children}
      {index !== null && (
        <div className="fixed inset-0 z-50" onClick={close}>
          <div className="absolute inset-0 bg-black/80" aria-hidden="true" />
          <div
            className="absolute inset-0 flex items-center justify-center p-4"
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
