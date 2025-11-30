"use client";

import { useEffect, useMemo, useState } from "react";
import { Models } from "node-appwrite";
import FolderCard from "@/components/FolderCard";
import Sort from "@/components/Sort";
import { deleteFolder } from "@/lib/actions/folder.actions";
import { useToast } from "@/hooks/use-toast";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { convertFileSize } from "@/lib/utils";

type FolderDoc = Models.Document & { size?: number };

const FolderPageClient = ({ folders }: { folders: FolderDoc[] }) => {
  const path = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<FolderDoc[]>(folders);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);

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
    try {
      const total = selectedIds.length;
      for (let i = 0; i < total; i++) {
        const id = selectedIds[i];
        const isLast = i === total - 1;
        await deleteFolder({ folderId: id, path, skipRevalidate: !isLast });
        setDeleteProgress(Math.round(((i + 1) / total) * 100));
      }

      const selectedSet = new Set(selectedIds);
      setItems((prev) => prev.filter((folder) => !selectedSet.has(folder.$id)));
      setSelected({});
      toast({ description: "Selected folders deleted." });
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
    }
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
              className="bulk-delete-button"
              variant="ghost"
              onClick={handleDeleteSelected}
              disabled={selectedCount === 0 || isDeleting}
            >
              Delete selected{selectedCount ? ` (${selectedCount})` : ""}
            </Button>

            <div className="sort-container">
              <p className="body-1 hidden text-light-200 sm:block">Sort by:</p>
              <Sort />
            </div>
          </div>

          {isDeleting && (
            <div className="delete-progress">
              <div className="caption text-light-200">
                Deleting... {deleteProgress}%
              </div>
              <div className="delete-progress-track">
                <div
                  className="delete-progress-bar"
                  style={{ width: `${deleteProgress}%` }}
                />
              </div>
            </div>
          )}
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
