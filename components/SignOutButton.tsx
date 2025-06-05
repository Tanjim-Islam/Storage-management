"use client";

import { signOutUser } from "@/lib/actions/user.actions";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const SignOutButton = ({ className }: { className?: string }) => {
  const handleClick = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("loggedIn");
    }
    await signOutUser();
  };

  return (
    <Button type="button" className={className} onClick={handleClick}>
      <Image
        src="/assets/icons/logout.svg"
        alt="logout"
        width={24}
        height={24}
        className="w-6"
      />
    </Button>
  );
};

export default SignOutButton;
