import type React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  placement?: "left" | "right" | "auto"; // alignment relative to toggle
  offsetX?: number; // horizontal offset in px
  offsetY?: number; // vertical offset in px
  anchorRef?: React.RefObject<HTMLElement>; // anchor element to align to
}

export const Dropdown: React.FC<DropdownProps> = ({
  isOpen,
  onClose,
  children,
  className = "",
  placement = "auto",
  offsetX = 0,
  offsetY = 0,
  anchorRef,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const inMenu = dropdownRef.current?.contains(target);
      const inToggle = (target as HTMLElement).closest(".dropdown-toggle");
      if (!inMenu && !inToggle) onClose();
    };

    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Compute body-level fixed coordinates based on anchor
  const computeCoords = () => {
    const anchor = anchorRef?.current as HTMLElement | undefined;
    const menu = dropdownRef.current as HTMLDivElement | null;
    if (!anchor || !menu) return;

    const rect = anchor.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 8;

    // Preferred placement to the right
    let left = rect.right + offsetX;
    if (placement === "left") left = rect.left - menuRect.width - offsetX;
    if (placement === "auto") {
      // Try right, flip to left if not enough space
      if (left + menuRect.width + margin > vw) {
        left = rect.left - menuRect.width - offsetX;
      }
      // If still offscreen, clamp inside viewport
      if (left < margin) left = margin;
      if (left + menuRect.width > vw - margin) left = vw - margin - menuRect.width;
    }

    if (placement === "right") {
      if (left + menuRect.width > vw - margin) {
        // If not enough space on right, clamp to viewport
        left = Math.max(margin, vw - margin - menuRect.width);
      }
    }

    const topPreferred = rect.top + rect.height + offsetY;
    let top = topPreferred;
    // If bottom overflows, try aligning from bottom of anchor
    if (top + menuRect.height > vh - margin) {
      top = Math.max(margin, vh - margin - menuRect.height);
    }

    setCoords({ top, left });
  };

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    // Wait for menu to mount then compute
    requestAnimationFrame(() => {
      computeCoords();
    });
  }, [isOpen, placement, offsetX, offsetY, anchorRef]);

  useEffect(() => {
    if (!isOpen) return;
    const onResize = () => computeCoords();
    const onScroll = () => computeCoords();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const menu = (
    <div
      ref={dropdownRef}
      style={{
        position: "fixed",
        top: coords?.top ?? 0,
        left: coords?.left ?? 0,
      }}
      className={`z-[1000] rounded-xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark ${className}`}
    >
      {children}
    </div>
  );

  return createPortal(menu, document.body);
};