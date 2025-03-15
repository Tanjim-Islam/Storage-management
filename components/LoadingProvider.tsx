"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { CircularLoader } from "./CircularLoader";

type LoadingContextType = {
  isLoading: boolean;
};

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // This effect runs on initial render and when pathname changes
    // Clear loading state when pathname changes (navigation completes)
    setIsLoading(false);
  }, [pathname]);

  useEffect(() => {
    // Handle link clicks globally
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if click is on a link or within a link element
      const linkElement = findParentLink(target);
      
      if (linkElement) {
        // Only show loader for internal navigation (not external links)
        const href = linkElement.getAttribute('href');
        if (href && !href.startsWith('http')) {
          setIsLoading(true);
        }
      }
    };
    
    // Helper function to find if an element or any of its parents is a link
    function findParentLink(element: HTMLElement | null): HTMLAnchorElement | null {
      while (element && element !== document.body) {
        if (element.tagName.toLowerCase() === 'a') {
          return element as HTMLAnchorElement;
        }
        element = element.parentElement;
      }
      return null;
    }

    // Add click listener to catch all link clicks
    document.addEventListener('click', handleLinkClick);
    
    return () => {
      document.removeEventListener('click', handleLinkClick);
    };
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading }}>
      {isLoading && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <CircularLoader size="xl" thickness="thick" label="Loading page..." />
        </div>
      )}
      {children}
    </LoadingContext.Provider>
  );
}

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};
