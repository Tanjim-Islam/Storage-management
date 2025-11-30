"use client";

import { useEffect, useMemo, useState } from "react";
import { Models } from "node-appwrite";
import { Button } from "@/components/ui/button";
import Card from "@/components/Card";
import Sort from "@/components/Sort";
import { convertFileSize } from "@/lib/utils";
import { deleteMultipleFiles } from "@/lib/actions/file.actions";
import { useToast } from "@/hooks/use-toast";
import { usePathname, useRouter } from "next/navigation";

type FileDoc = Models.Document & { bucketField: string; size?: number };

const TypePageClient = ({ files, type }: { files: FileDoc[]; type: string }) => {
  const path = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<FileDoc[]>(files);
  const [selected, setSelected] = useState<Record<string, { bucketField: string }>>({});
  const [isDeleting, setIsDeleting] = useState(false);

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
    try {
      const payload = Object.entries(selected).map(([fileId, meta]) => ({
        fileId,
        bucketField: meta.bucketField,
      }));

      const success = await deleteMultipleFiles({ files: payload, path });
      if (success) {
        const selectedIds = new Set(Object.keys(selected));
        setItems((prev) => prev.filter((file) => !selectedIds.has(file.$id)));
        setSelected({});
        toast({ description: "Selected files deleted." });
        router.refresh();
      } else {
        toast({
          description: "Failed to delete selected files.",
          className: "error-toast",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        description: "Failed to delete selected files.",
        className: "error-toast",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const totalSize = useMemo(
    () => items.reduce((sum, file) => sum + (file.size || 0), 0),
    [items],
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
