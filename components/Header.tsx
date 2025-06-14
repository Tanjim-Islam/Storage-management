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
          <img src="/assets/icons/folder.svg" alt="folder" width={24} height={24} />
          <span className="sr-only">Upload folder</span>
        </label>
        <FolderUploader ownerId={userId} accountId={accountId} />
        <SignOutButton className="sign-out-button" />
      </div>
    </header>
  );
};
export default Header;
