import React from "react";
import Image, { ImageProps, StaticImageData } from "next/image";

// Import all SVG icons statically
import dashboardIcon from "../public/assets/icons/dashboard.svg";
import documentsIcon from "../public/assets/icons/documents.svg";
import imagesIcon from "../public/assets/icons/images.svg";
import videoIcon from "../public/assets/icons/video.svg";
import othersIcon from "../public/assets/icons/others.svg";
import logoutIcon from "../public/assets/icons/logout.svg";
import menuIcon from "../public/assets/icons/menu.svg";

// Map of icon paths to their imported static assets
const iconMap: Record<string, StaticImageData> = {
  "/assets/icons/dashboard.svg": dashboardIcon,
  "/assets/icons/documents.svg": documentsIcon,
  "/assets/icons/images.svg": imagesIcon,
  "/assets/icons/video.svg": videoIcon,
  "/assets/icons/others.svg": othersIcon,
  "/assets/icons/logout.svg": logoutIcon,
  "/assets/icons/menu.svg": menuIcon,
};

interface OptimizedIconProps extends Omit<ImageProps, "src"> {
  src: string;
  isActive?: boolean;
}

// Optimized icon component that uses static imports when available
const OptimizedIcon: React.FC<OptimizedIconProps> = ({
  src,
  className,
  alt = "icon",
  ...props
}) => {
  // Use static import if available, otherwise use the path
  const iconSrc = iconMap[src] || src;

  return (
    <Image
      src={iconSrc}
      className={className}
      priority={true}
      alt={alt}
      {...props}
    />
  );
};

export default React.memo(OptimizedIcon);
