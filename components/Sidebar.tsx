"use client";

import Link from "next/link";
import Image from "next/image";
import { memo } from "react";
import OptimizedNavigation from "./OptimizedNavigation";

interface Props {
  fullName: string;
  avatar: string;
  email: string;
}

const Sidebar = ({ fullName, avatar, email }: Props) => {
  return (
    <aside className="sidebar">
      <Link href="/">
        <Image
          src="/assets/icons/logo-full-brand.svg"
          alt="logo"
          width={160}
          height={50}
          priority={true}
          className="hidden h-auto lg:block"
        />

        <Image
          src="/assets/icons/logo-brand.svg"
          alt="logo"
          width={52}
          height={52}
          priority={true}
          className="lg:hidden"
        />
      </Link>

      <OptimizedNavigation />

      <Image
        src="/assets/images/files-2.png"
        alt="logo"
        width={506}
        height={418}
        loading="lazy"
        className="w-full"
      />

      <div className="sidebar-user-info">
        <Image
          src={avatar}
          alt="Avatar"
          width={44}
          height={44}
          loading="lazy"
          className="sidebar-user-avatar"
        />
        <div className="hidden lg:block">
          <p className="subtitle-2 capitalize">{fullName}</p>
          <p className="caption">{email}</p>
        </div>
      </div>
    </aside>
  );
};
export default memo(Sidebar);
