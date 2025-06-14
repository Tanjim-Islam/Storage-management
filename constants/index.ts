export const navItems = [
  {
    name: "Dashboard",
    icon: "/assets/icons/dashboard.svg",
    url: "/",
    prefetch: true,
  },
  {
    name: "Documents",
    icon: "/assets/icons/documents.svg",
    url: "/documents",
    prefetch: true,
  },
  {
    name: "Images",
    icon: "/assets/icons/images.svg",
    url: "/images",
    prefetch: true,
  },
  {
    name: "Videos",
    icon: "/assets/icons/video.svg",
    url: "/media",
    prefetch: true,
  },
  {
    name: "Folders",
    icon: "/assets/icons/folder-sidebar.svg",
    activeIcon: "/assets/icons/folder-sidebar-active.svg",
    url: "/folders",
    prefetch: true,
  },
  {
    name: "Others",
    icon: "/assets/icons/others.svg",
    url: "/others",
    prefetch: true,
  },
  {
    name: "Profile",
    icon: "/assets/icons/user.svg",
    url: "/profile",
    prefetch: true,
  },
];

export const actionsDropdownItems = [
  {
    label: "Rename",
    icon: "/assets/icons/edit.svg",
    value: "rename",
  },
  {
    label: "Details",
    icon: "/assets/icons/info.svg",
    value: "details",
  },
  {
    label: "Share",
    icon: "/assets/icons/share.svg",
    value: "share",
  },
  {
    label: "Download",
    icon: "/assets/icons/download.svg",
    value: "download",
  },
  {
    label: "Delete",
    icon: "/assets/icons/delete.svg",
    value: "delete",
  },
];

export const sortTypes = [
  {
    label: "Date created (newest)",
    value: "$createdAt-desc",
  },
  {
    label: "Created Date (oldest)",
    value: "$createdAt-asc",
  },
  {
    label: "Name (A-Z)",
    value: "name-asc",
  },
  {
    label: "Name (Z-A)",
    value: "name-desc",
  },
  {
    label: "Size (Highest)",
    value: "size-desc",
  },
  {
    label: "Size (Lowest)",
    value: "size-asc",
  },
];

export const avatarPlaceholderUrl =
  "https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg";

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
