import React, { useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "@/constants";
import OptimizedIcon from "./OptimizedIcon";

interface NavItemProps {
  url: string;
  name: string;
  icon: string;
  isActive: boolean;
  onClick: () => void;
}

// Highly optimized navigation item component
const NavItem = React.memo(
  ({ url, name, icon, isActive, onClick }: NavItemProps) => {
    return (
      <Link href={url} prefetch={true} onClick={onClick} className="lg:w-full">
        <li className={cn("sidebar-nav-item", isActive && "shad-active")}>
          {name === "Profile" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={24}
              height={24}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn("profile-icon", isActive && "profile-icon-active")}
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
              <path d="M12 10m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
              <path d="M6.168 18.849a4 4 0 0 1 3.832 -2.849h4a4 4 0 0 1 3.834 2.855" />
            </svg>
          ) : (
            <OptimizedIcon
              src={icon}
              alt={name}
              width={24}
              height={24}
              className={cn("nav-icon", isActive && "nav-icon-active")}
            />
          )}
          <p className="hidden lg:block">{name}</p>
        </li>
      </Link>
    );
  }
);

NavItem.displayName = "NavItem";

interface OptimizedNavigationProps {
  className?: string;
  onItemClick?: () => void;
}

// Main navigation component with instant navigation
const OptimizedNavigation: React.FC<OptimizedNavigationProps> = ({
  className,
  onItemClick = () => {},
}) => {
  const pathname = usePathname();
  const router = useRouter();

  // Preload all routes on component mount
  React.useEffect(() => {
    // Preload all routes
    navItems.forEach((item) => {
      router.prefetch(item.url);
    });

    // Preload all images
    const preloadImages = () => {
      navItems.forEach((item) => {
        const img = new Image();
        img.src = item.icon;
      });
    };
    preloadImages();
  }, [router]);

  // Handle navigation click with client-side transition
  const handleNavClick = useCallback(
    (url: string) => {
      return () => {
        onItemClick();
        router.push(url);
      };
    },
    [onItemClick, router]
  );

  // Memoize navigation items to prevent re-renders
  const navigationItems = useMemo(() => {
    return navItems.map(({ url, name, icon }) => {
      const active =
        pathname === url || (url === "/folders" && pathname.startsWith("/folders"));
      return (
        <NavItem
          key={name}
          url={url}
          name={name}
          icon={icon}
          isActive={active}
          onClick={handleNavClick(url)}
        />
      );
    });
  }, [pathname, handleNavClick]);

  return (
    <nav className={className || "sidebar-nav"}>
      <ul className="flex flex-1 flex-col gap-6">{navigationItems}</ul>
    </nav>
  );
};

export default React.memo(OptimizedNavigation);
