import React from "react";
import Search from "@/components/Search";
import FileUploader from "@/components/FileUploader";
import FolderUploader from "@/components/FolderUploader";
import SignOutButton from "@/components/SignOutButton";

const Header = ({
  userId,
  accountId,
}: {
  userId: string;
  accountId: string;
}) => {
  return (
    <header className="header">
      <Search />
      <div className="header-wrapper">
        <FileUploader ownerId={userId} accountId={accountId} />
        <label htmlFor="folder-upload" className="uploader-button">
          <div className="flex items-center justify-center gap-2">
            <img src="/assets/icons/folder.svg" alt="folder" width={20} height={20} />
            <span className="text-sm">Upload Folder</span>
          </div>
        </label>
        <FolderUploader ownerId={userId} accountId={accountId} />
        <SignOutButton className="sign-out-button" />
      </div>
    </header>
  );
};
export default Header;
