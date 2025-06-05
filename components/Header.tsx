import React from "react";
import Search from "@/components/Search";
import FileUploader from "@/components/FileUploader";
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
        <SignOutButton className="sign-out-button" />
      </div>
    </header>
  );
};
export default Header;
