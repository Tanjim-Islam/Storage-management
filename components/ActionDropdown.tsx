"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import Image from "next/image";
import { Models } from "node-appwrite";
import { actionsDropdownItems } from "@/constants";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  deleteFile,
  renameFile,
  updateFileInvites,
  createFileShareLink,
  revokeFileShareLink,
  setFileInviteeRole,
} from "@/lib/actions/file.actions";
import { usePathname } from "next/navigation";
import { FileDetails, FileShareSettings } from "@/components/ActionsModalContent";
import {
  buildShareLink,
  constructDownloadUrl,
  formatDateTime,
} from "@/lib/utils";

type ShareExpirationOption = "24h" | "7d" | "30d" | "never";

const ActionDropdown = ({ file }: { file: Models.Document }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [action, setAction] = useState<ActionType | null>(null);
  const [name, setName] = useState(file.name);
  const [isLoading, setIsLoading] = useState(false);
  const [invites, setInvites] = useState<ShareInvitee[]>(() => {
    if (Array.isArray(file.sharedWith) && file.sharedWith.length) {
      return file.sharedWith as ShareInvitee[];
    }

    if (Array.isArray(file.users) && file.users.length) {
      return (file.users as string[]).map((email) => ({
        email,
        role: "viewer",
      }));
    }

    return [];
  });
  const [shareExpiresAt, setShareExpiresAt] = useState<string | null>(
    file.shareExpiresAt ?? null,
  );
  const [shareLink, setShareLink] = useState<string>(() =>
    file.shareToken ? buildShareLink(file.shareToken as string) : "",
  );
  const [newInviteEmail, setNewInviteEmail] = useState("");
  const [newInviteRole, setNewInviteRole] = useState<ShareRole>("viewer");
  const [expirationOption, setExpirationOption] =
    useState<ShareExpirationOption>("7d");
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isRevokingLink, setIsRevokingLink] = useState(false);
  const [isInviteLoading, setIsInviteLoading] = useState(false);
  const [roleUpdatingEmail, setRoleUpdatingEmail] = useState<string | null>(
    null,
  );
  const [copyLabel, setCopyLabel] = useState("Copy link");

  const path = usePathname();

  const resetShareState = () => {
    const initialInvites = Array.isArray(file.sharedWith)
      ? (file.sharedWith as ShareInvitee[])
      : Array.isArray(file.users)
        ? (file.users as string[]).map((email) => ({
            email,
            role: "viewer" as ShareRole,
          }))
        : [];

    setInvites(initialInvites);
    const token = (file.shareToken as string) ?? null;
    setShareExpiresAt((file.shareExpiresAt as string) ?? null);
    setShareLink(token ? buildShareLink(token) : "");
    setNewInviteEmail("");
    setNewInviteRole("viewer");
    setExpirationOption("7d");
    setCopyLabel("Copy link");
    setIsGeneratingLink(false);
    setIsRevokingLink(false);
    setIsInviteLoading(false);
    setRoleUpdatingEmail(null);
  };

  const closeAllModals = () => {
    setIsModalOpen(false);
    setIsDropdownOpen(false);
    setAction(null);
    setName(file.name);
    resetShareState();
  };

  const handleAction = async () => {
    if (!action) return;
    if (action.value === "share") return;
    setIsLoading(true);
    let success = false;

    const actions = {
      rename: () =>
        renameFile({ fileId: file.$id, name, extension: file.extension, path }),
      delete: () =>
        deleteFile({ fileId: file.$id, bucketField: file.bucketField, path }),
    };

    success = await actions[action.value as keyof typeof actions]!();

    if (success) closeAllModals();

    setIsLoading(false);
  };

  const syncFromDocument = (doc: Models.Document) => {
    const nextInvites = Array.isArray(doc.sharedWith)
      ? (doc.sharedWith as ShareInvitee[])
      : [];
    setInvites(nextInvites);
    const token = (doc.shareToken as string) ?? null;
    setShareExpiresAt((doc.shareExpiresAt as string) ?? null);
    setShareLink(token ? buildShareLink(token) : "");
  };

  const computeExpirationDate = (option: ShareExpirationOption) => {
    if (option === "never") return null;

    const optionMap: Record<ShareExpirationOption, number> = {
      "24h": 24,
      "7d": 24 * 7,
      "30d": 24 * 30,
      never: 0,
    };

    const hours = optionMap[option];
    const expires = new Date();
    expires.setHours(expires.getHours() + hours);
    return expires.toISOString();
  };

  const handleGenerateLink = async () => {
    setIsGeneratingLink(true);
    try {
      const expiresAt = computeExpirationDate(expirationOption);
      const updated = await createFileShareLink({
        fileId: file.$id,
        expiresAt,
        path,
      });

      if (updated) {
        syncFromDocument(updated);
        if (expiresAt) {
          setShareExpiresAt(expiresAt);
        }
      }
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleRevokeLink = async () => {
    setIsRevokingLink(true);
    try {
      const updated = await revokeFileShareLink({ fileId: file.$id, path });
      if (updated) {
        syncFromDocument(updated);
        setShareExpiresAt(null);
      }
    } finally {
      setIsRevokingLink(false);
    }
  };

  const persistInvites = async (nextInvites: ShareInvitee[]) => {
    setIsInviteLoading(true);
    try {
      const updated = await updateFileInvites({
        fileId: file.$id,
        invites: nextInvites,
        path,
      });

      if (updated) {
        syncFromDocument(updated);
        setNewInviteEmail("");
        setNewInviteRole("viewer");
      }
    } finally {
      setIsInviteLoading(false);
    }
  };

  const handleAddInvite = async () => {
    if (!newInviteEmail.trim()) return;

    const normalizedEmail = newInviteEmail.trim().toLowerCase();
    const existingIndex = invites.findIndex(
      (invite) => invite.email === normalizedEmail,
    );

    let nextInvites = invites;
    if (existingIndex === -1) {
      nextInvites = [...invites, { email: normalizedEmail, role: newInviteRole }];
    } else {
      nextInvites = invites.map((invite, index) =>
        index === existingIndex ? { ...invite, role: newInviteRole } : invite,
      );
    }

    await persistInvites(nextInvites);
  };

  const handleInviteRoleChange = async (email: string, role: ShareRole) => {
    setRoleUpdatingEmail(email);
    try {
      const updated = await setFileInviteeRole({
        fileId: file.$id,
        email,
        role,
        path,
      });

      if (updated) {
        syncFromDocument(updated);
      }
    } finally {
      setRoleUpdatingEmail(null);
    }
  };

  const handleRemoveInvite = async (email: string) => {
    const nextInvites = invites.filter((invite) => invite.email !== email);
    await persistInvites(nextInvites);
  };

  const handleCopyLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopyLabel("Copied!");
      setTimeout(() => setCopyLabel("Copy link"), 2000);
    } catch (error) {
      console.error("Failed to copy link", error);
    }
  };

  const renderDialogContent = () => {
    if (!action) return null;

    const { value, label } = action;

    return (
      <DialogContent className="shad-dialog button">
        <DialogHeader className="flex flex-col gap-3">
          <DialogTitle className="text-center text-light-100">
            {label}
          </DialogTitle>
          {value === "rename" && (
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          {value === "details" && <FileDetails file={file} />}
          {value === "share" && (
            <FileShareSettings
              file={file}
              shareLink={shareLink}
              shareExpiresAt={shareExpiresAt}
              expirationOption={expirationOption}
              onExpirationChange={setExpirationOption}
              onGenerateLink={handleGenerateLink}
              onRevokeLink={handleRevokeLink}
              onCopyLink={handleCopyLink}
              invites={invites}
              newInviteEmail={newInviteEmail}
              newInviteRole={newInviteRole}
              onNewInviteEmailChange={setNewInviteEmail}
              onNewInviteRoleChange={setNewInviteRole}
              onAddInvite={handleAddInvite}
              onInviteRoleChange={handleInviteRoleChange}
              onRemoveInvite={handleRemoveInvite}
              isGeneratingLink={isGeneratingLink}
              isRevokingLink={isRevokingLink}
              isInviteLoading={isInviteLoading}
              roleUpdatingEmail={roleUpdatingEmail}
              copyLabel={copyLabel}
              expiresLabel={
                shareExpiresAt ? formatDateTime(shareExpiresAt) : "No expiration"
              }
            />
          )}
          {value === "delete" && (
            <p className="break-words text-center">
              Are you sure you want to delete{` `}
              <span className="break-all font-medium">{file.name}</span>?
            </p>
          )}
        </DialogHeader>
        {value === "share" && (
          <DialogFooter className="flex justify-end">
            <Button onClick={closeAllModals} className="modal-cancel-button">
              Close
            </Button>
          </DialogFooter>
        )}
        {["rename", "delete"].includes(value) && (
          <DialogFooter className="flex flex-col gap-3 md:flex-row">
            <Button onClick={closeAllModals} className="modal-cancel-button">
              Cancel
            </Button>
            <Button onClick={handleAction} className="modal-submit-button">
              <p className="capitalize">{value}</p>
              {isLoading && (
                <Image
                  src="/assets/icons/loader.svg"
                  alt="loader"
                  width={24}
                  height={24}
                  className="animate-spin"
                />
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    );
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger className="shad-no-focus">
          <Image
            src="/assets/icons/dots.svg"
            alt="dots"
            width={34}
            height={34}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel className="max-w-[200px] truncate">
            {file.name}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {actionsDropdownItems.map((actionItem) => (
            <DropdownMenuItem
              key={actionItem.value}
              className="shad-dropdown-item"
              onClick={() => {
                setAction(actionItem);

                if (
                  ["rename", "share", "delete", "details"].includes(
                    actionItem.value,
                  )
                ) {
                  setIsModalOpen(true);
                }
              }}
            >
              {actionItem.value === "download" ? (
                <Link
                  href={constructDownloadUrl(file.bucketField)}
                  download={file.name}
                  className="flex items-center gap-2"
                >
                  <Image
                    src={actionItem.icon}
                    alt={actionItem.label}
                    width={30}
                    height={30}
                  />
                  {actionItem.label}
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Image
                    src={actionItem.icon}
                    alt={actionItem.label}
                    width={30}
                    height={30}
                  />
                  {actionItem.label}
                </div>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {renderDialogContent()}
    </Dialog>
  );
};
export default ActionDropdown;
