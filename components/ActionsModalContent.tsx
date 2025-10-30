import { Models } from "node-appwrite";
import Thumbnail from "@/components/Thumbnail";
import FormattedDateTime from "@/components/FormattedDateTime";
import { convertFileSize, formatDateTime } from "@/lib/utils";
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

const ImageThumbnail = ({ file }: { file: Models.Document }) => (
  <div className="file-details-thumbnail">
    <Thumbnail type={file.type} extension={file.extension} url={file.url} />
    <div className="flex flex-col">
      <p className="subtitle-2 mb-1">{file.name}</p>
      <FormattedDateTime date={file.$createdAt} className="caption" />
    </div>
  </div>
);

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex">
    <p className="file-details-label text-left">{label}</p>
    <p className="file-details-value text-left">{value}</p>
  </div>
);

export const FileDetails = ({ file }: { file: Models.Document }) => {
  return (
    <>
      <ImageThumbnail file={file} />
      <div className="space-y-4 px-2 pt-2">
        <DetailRow label="Format:" value={file.extension} />
        <DetailRow label="Size:" value={convertFileSize(file.size)} />
        <DetailRow label="Owner:" value={file.owner.fullName} />
        <DetailRow label="Last edit:" value={formatDateTime(file.$updatedAt)} />
      </div>
    </>
  );
};

interface Props {
  file: Models.Document;
  onInputChange: React.Dispatch<React.SetStateAction<string[]>>;
  onRemove: (email: string) => void;
}

export const ShareInput = ({ file, onInputChange, onRemove }: Props) => {
  return (
    <>
      <ImageThumbnail file={file} />

      <div className="share-wrapper">
        <p className="subtitle-2 pl-1 text-light-100">
          Share file with other users
        </p>
        <Input
          type="email"
          placeholder="Enter email address"
          onChange={(e) => onInputChange(e.target.value.trim().split(","))}
          className="share-input-field"
        />
        <div className="pt-4">
          <div className="flex justify-between">
            <p className="subtitle-2 text-light-100">Shared with</p>
            <p className="subtitle-2 text-light-200">
              {file.users.length} users
            </p>
          </div>

          <ul className="pt-2">
            {file.users.map((email: string) => (
              <li
                key={email}
                className="flex items-center justify-between gap-2"
              >
                <p className="subtitle-2">{email}</p>
                <Button
                  onClick={() => onRemove(email)}
                  className="share-remove-user"
                >
                  <Image
                    src="/assets/icons/remove.svg"
                    alt="Remove"
                    width={24}
                    height={24}
                    className="remove-icon"
                  />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

type ShareExpirationOption = "24h" | "7d" | "30d" | "never";

interface FileShareSettingsProps {
  file: Models.Document;
  shareLink: string;
  isPublic: boolean;
  shareExpiresAt: string | null;
  expirationOption: ShareExpirationOption;
  onExpirationChange: (value: ShareExpirationOption) => void;
  onGenerateLink: () => void;
  onRevokeLink: () => void;
  onCopyLink: () => void;
  invites: ShareInvitee[];
  newInviteEmail: string;
  newInviteRole: ShareRole;
  onNewInviteEmailChange: (value: string) => void;
  onNewInviteRoleChange: (role: ShareRole) => void;
  onAddInvite: () => void;
  onInviteRoleChange: (email: string, role: ShareRole) => void;
  onRemoveInvite: (email: string) => void;
  isGeneratingLink?: boolean;
  isRevokingLink?: boolean;
  isInviteLoading?: boolean;
  roleUpdatingEmail?: string | null;
  copyLabel?: string;
  expiresLabel?: string;
}

const roleOptions: { label: string; value: ShareRole }[] = [
  { label: "Viewer", value: "viewer" },
  { label: "Editor", value: "editor" },
];

const expirationOptions: { label: string; value: ShareExpirationOption }[] = [
  { label: "24 hours", value: "24h" },
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "Never", value: "never" },
];

export const FileShareSettings = ({
  file,
  shareLink,
  isPublic,
  shareExpiresAt,
  expirationOption,
  onExpirationChange,
  onGenerateLink,
  onRevokeLink,
  onCopyLink,
  invites,
  newInviteEmail,
  newInviteRole,
  onNewInviteEmailChange,
  onNewInviteRoleChange,
  onAddInvite,
  onInviteRoleChange,
  onRemoveInvite,
  isGeneratingLink = false,
  isRevokingLink = false,
  isInviteLoading = false,
  roleUpdatingEmail,
  copyLabel = "Copy link",
  expiresLabel,
}: FileShareSettingsProps) => {
  const isExpired = shareExpiresAt
    ? new Date(shareExpiresAt) < new Date()
    : false;

  return (
    <>
      <ImageThumbnail file={file} />
      <div className="share-wrapper space-y-6">
        <section className="space-y-3">
          <p className="subtitle-2 pl-1 text-light-100">Share link</p>
          {isPublic && shareLink ? (
            <div className="space-y-3">
              <div className="flex flex-col gap-2 md:flex-row">
                <Input value={shareLink} readOnly className="share-input-field flex-1" />
                <div className="flex flex-col gap-2 md:flex-row">
                  <Button
                    onClick={onCopyLink}
                    className="modal-submit-button whitespace-nowrap"
                    disabled={!shareLink}
                  >
                    {copyLabel}
                  </Button>
                  <Button
                    onClick={onRevokeLink}
                    disabled={isRevokingLink}
                    variant="secondary"
                    className="modal-cancel-button whitespace-nowrap"
                  >
                    {isRevokingLink ? "Revoking..." : "Revoke"}
                  </Button>
                </div>
              </div>
              <p className="caption text-light-200">
                {expiresLabel}
                {isExpired ? " (expired)" : ""}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Select
                  value={expirationOption}
                  onValueChange={(value) =>
                    onExpirationChange(value as ShareExpirationOption)
                  }
                >
                  <SelectTrigger className="share-input-field">
                    <SelectValue placeholder="Choose expiration" />
                  </SelectTrigger>
                  <SelectContent>
                    {expirationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={onGenerateLink}
                className="modal-submit-button"
                disabled={isGeneratingLink}
              >
                {isGeneratingLink ? "Generating..." : "Generate link"}
              </Button>
            </div>
          )}
        </section>

        <Separator className="opacity-40" />

        <section className="space-y-3">
          <p className="subtitle-2 pl-1 text-light-100">Invite collaborators</p>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <Input
              type="email"
              value={newInviteEmail}
              placeholder="Enter email address"
              onChange={(event) => onNewInviteEmailChange(event.target.value)}
              className="share-input-field md:flex-1"
            />
            <Select
              value={newInviteRole}
              onValueChange={(value) => onNewInviteRoleChange(value as ShareRole)}
            >
              <SelectTrigger className="md:w-[140px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={onAddInvite}
              className="modal-submit-button whitespace-nowrap"
              disabled={isInviteLoading || !newInviteEmail}
            >
              {isInviteLoading ? "Saving..." : "Add"}
            </Button>
          </div>

          <div className="space-y-2">
            {invites.length === 0 ? (
              <p className="caption text-light-200">
                No collaborators have been added yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {invites.map((invite) => (
                  <li
                    key={invite.email}
                    className="flex flex-col gap-2 rounded-lg border border-dashed border-light-400 px-3 py-2 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="subtitle-2">{invite.email}</p>
                    </div>
                    <div className="flex flex-col gap-2 md:flex-row md:items-center">
                      <Select
                        value={invite.role}
                        onValueChange={(value) =>
                          onInviteRoleChange(invite.email, value as ShareRole)
                        }
                        disabled={roleUpdatingEmail === invite.email}
                      >
                        <SelectTrigger className="md:w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => onRemoveInvite(invite.email)}
                        className="modal-cancel-button"
                        variant="secondary"
                      >
                        Remove
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </>
  );
};
