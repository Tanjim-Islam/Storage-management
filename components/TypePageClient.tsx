"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Models } from "node-appwrite";
import { Button } from "@/components/ui/button";
import Card from "@/components/Card";
import Sort from "@/components/Sort";
import { convertFileSize } from "@/lib/utils";
import { deleteFile } from "@/lib/actions/file.actions";
import { useToast } from "@/hooks/use-toast";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

type FileDoc = Models.Document & { bucketField: string; size?: number };

const TypePageClient = ({
  files,
  type,
}: {
  files: FileDoc[];
  type: string;
}) => {
  const path = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<FileDoc[]>(files);
  const [selected, setSelected] = useState<
    Record<string, { bucketField: string }>
  >({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [isHoveringDelete, setIsHoveringDelete] = useState(false);
  const cancelDeleteRef = useRef(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setItems(files);
    setSelected({});
  }, [files]);

  const toggleSelect = (file: FileDoc) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[file.$id]) {
        delete next[file.$id];
      } else {
        next[file.$id] = { bucketField: file.bucketField };
      }
      return next;
    });
  };

  const selectAll = () => {
    if (items.length === 0) return;
    const allSelected = items.length === Object.keys(selected).length;
    if (allSelected) {
      setSelected({});
    } else {
      const map: Record<string, { bucketField: string }> = {};
      items.forEach((file) => {
        map[file.$id] = { bucketField: file.bucketField };
      });
      setSelected(map);
    }
  };

  const handleDeleteSelected = async () => {
    if (!Object.keys(selected).length) return;
    setIsDeleting(true);
    setDeleteProgress(0);
    cancelDeleteRef.current = false;

    const deletedIds: string[] = [];
    try {
      const entries = Object.entries(selected);
      const total = entries.length;

      for (let i = 0; i < total; i++) {
        if (cancelDeleteRef.current) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          toast({
            description: `Deletion cancelled. ${deletedIds.length} files deleted.`,
          });
          break;
        }

        const [fileId, meta] = entries[i];
        const isLast = i === total - 1 || cancelDeleteRef.current;
        
        // Calculate progress range for this item
        const startProgress = Math.round((i / total) * 100);
        const endProgress = Math.round(((i + 1) / total) * 100);
        
        // Start simulated progress for this item
        setDeleteProgress(startProgress + 1);
        let simulatedProgress = startProgress + 1;
        
        progressIntervalRef.current = setInterval(() => {
          simulatedProgress = Math.min(simulatedProgress + 2, endProgress - 5);
          setDeleteProgress(simulatedProgress);
        }, 100);
        
        await deleteFile({
          fileId,
          bucketField: meta.bucketField,
          path,
          skipRevalidate: !isLast,
        });
        
        // Clear interval and set actual progress
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        deletedIds.push(fileId);
        setDeleteProgress(endProgress);
      }

      const deletedSet = new Set(deletedIds);
      setItems((prev) => prev.filter((file) => !deletedSet.has(file.$id)));

      // Remove deleted items from selection
      setSelected((prev) => {
        const next = { ...prev };
        deletedIds.forEach((id) => delete next[id]);
        return next;
      });

      if (!cancelDeleteRef.current) {
        toast({ description: "Selected files deleted." });
      }
      router.refresh();
    } catch (error) {
      console.error(error);
      toast({
        description: "Failed to delete selected files.",
        className: "error-toast",
      });
    } finally {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setIsDeleting(false);
      setDeleteProgress(0);
      cancelDeleteRef.current = false;
    }
  };

  const handleCancelDelete = () => {
    cancelDeleteRef.current = true;
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const totalSize = useMemo(
    () => items.reduce((sum, file) => sum + (file.size || 0), 0),
    [items]
  );

  const allSelected =
    items.length > 0 && Object.keys(selected).length === items.length;

  const selectedCount = Object.keys(selected).length;

  return (
    <div className="page-container">
      <section className="w-full">
        <h1 className="h1 capitalize">{type}</h1>

        <div className="total-size-section">
          <p className="body-1">
            Total: <span className="h5">{convertFileSize(totalSize)}</span>
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <label className="select-all-toggle">
              <input
                type="checkbox"
                className="selection-checkbox"
                checked={allSelected}
                onChange={selectAll}
              />
              <span>Select all</span>
            </label>

            <Button
              type="button"
              className={`bulk-delete-button relative overflow-hidden ${isDeleting ? "min-w-[160px]" : ""}`}
              variant="ghost"
              onClick={isDeleting ? handleCancelDelete : handleDeleteSelected}
              disabled={selectedCount === 0 && !isDeleting}
              onMouseEnter={() => setIsHoveringDelete(true)}
              onMouseLeave={() => setIsHoveringDelete(false)}
            >
              {isDeleting && (
                <div
                  className="absolute inset-0 bg-error/20 transition-[width] duration-200"
                  style={{ width: `${deleteProgress}%` }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {isDeleting ? (
                  isHoveringDelete ? (
                    <>
                      <Image
                        src="/assets/icons/close.svg"
                        alt="cancel"
                        width={16}
                        height={16}
                        className="brightness-0 invert-[0.4] sepia-[1] saturate-[50] hue-rotate-[-50deg]"
                      />
                      Cancel
                    </>
                  ) : (
                    <>Deleting... {deleteProgress}%</>
                  )
                ) : (
                  <>
                    Delete selected{selectedCount ? ` (${selectedCount})` : ""}
                  </>
                )}
              </span>
            </Button>

            <div className="sort-container">
              <p className="body-1 hidden text-light-200 sm:block">Sort by:</p>
              <Sort />
            </div>
          </div>
        </div>
      </section>

      {items.length > 0 ? (
        <section className="file-list">
          {items.map((file, i) => (
            <Card
              key={file.$id}
              file={file}
              index={i}
              selectionEnabled
              selected={!!selected[file.$id]}
              onToggleSelect={() => toggleSelect(file)}
            />
          ))}
        </section>
      ) : (
        <p className="empty-list">No files uploaded</p>
      )}
    </div>
  );
};

export default TypePageClient;
