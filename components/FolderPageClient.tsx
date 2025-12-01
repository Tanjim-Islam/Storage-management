"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Models } from "node-appwrite";
import FolderCard from "@/components/FolderCard";
import Sort from "@/components/Sort";
import { deleteFolder } from "@/lib/actions/folder.actions";
import { useToast } from "@/hooks/use-toast";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { convertFileSize } from "@/lib/utils";
import Image from "next/image";

type FolderDoc = Models.Document & { size?: number };

const FolderPageClient = ({ folders }: { folders: FolderDoc[] }) => {
  const path = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<FolderDoc[]>(folders);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [isHoveringDelete, setIsHoveringDelete] = useState(false);
  const cancelDeleteRef = useRef(false);

  useEffect(() => {
    setItems(folders);
    setSelected({});
  }, [folders]);

  const toggleSelect = (folder: FolderDoc) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[folder.$id]) {
        delete next[folder.$id];
      } else {
        next[folder.$id] = true;
      }
      return next;
    });
  };

  const selectAll = () => {
    if (!items.length) return;
    const isAllSelected = items.length === Object.keys(selected).length;
    if (isAllSelected) {
      setSelected({});
      return;
    }

    const map: Record<string, boolean> = {};
    items.forEach((folder) => {
      map[folder.$id] = true;
    });
    setSelected(map);
  };

  const handleDeleteSelected = async () => {
    const selectedIds = Object.keys(selected).filter((id) => selected[id]);
    if (!selectedIds.length) return;
    setIsDeleting(true);
    setDeleteProgress(0);
    cancelDeleteRef.current = false;
    
    const deletedIds: string[] = [];
    try {
      const total = selectedIds.length;
      for (let i = 0; i < total; i++) {
        if (cancelDeleteRef.current) {
          toast({ description: `Deletion cancelled. ${deletedIds.length} folders deleted.` });
          break;
        }
        
        const id = selectedIds[i];
        const isLast = i === total - 1 || cancelDeleteRef.current;
        await deleteFolder({ folderId: id, path, skipRevalidate: !isLast });
        deletedIds.push(id);
        setDeleteProgress(Math.round(((i + 1) / total) * 100));
      }

      const deletedSet = new Set(deletedIds);
      setItems((prev) => prev.filter((folder) => !deletedSet.has(folder.$id)));
      
      // Remove deleted items from selection
      setSelected((prev) => {
        const next = { ...prev };
        deletedIds.forEach((id) => delete next[id]);
        return next;
      });
      
      if (!cancelDeleteRef.current) {
        toast({ description: "Selected folders deleted." });
      }
      router.refresh();
    } catch (error) {
      console.error(error);
      toast({
        description: "Failed to delete selected folders.",
        className: "error-toast",
      });
    } finally {
      setIsDeleting(false);
      setDeleteProgress(0);
      cancelDeleteRef.current = false;
    }
  };

  const handleCancelDelete = () => {
    cancelDeleteRef.current = true;
  };

  const totalSize = useMemo(
    () => items.reduce((sum, folder) => sum + (folder.size || 0), 0),
    [items],
  );

  const allSelected =
    items.length > 0 && Object.keys(selected).length === items.length;
  const selectedCount = Object.keys(selected).length;

  return (
    <div className="page-container">
      <section className="w-full">
        <h1 className="h1">Folders</h1>
        
        <div className="total-size-section">
          <p className="body-1">
            Total: <span className="h5">{items.length}</span>
            <span className="caption ml-2 text-light-200">
              ({convertFileSize(totalSize)})
            </span>
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
              className={`bulk-delete-button relative overflow-hidden ${isDeleting ? 'min-w-[160px]' : ''}`}
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
                  <>Delete selected{selectedCount ? ` (${selectedCount})` : ""}</>
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
          {items.map((folder: FolderDoc) => (
            <FolderCard
              key={folder.$id}
              folder={folder}
              selectionEnabled
              selected={!!selected[folder.$id]}
              onToggleSelect={() => toggleSelect(folder)}
            />
          ))}
        </section>
      ) : (
        <p className="empty-list">No folders uploaded</p>
      )}
    </div>
  );
};

export default FolderPageClient;
