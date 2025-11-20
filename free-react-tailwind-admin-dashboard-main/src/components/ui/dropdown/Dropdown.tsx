import type React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  placement?: "left" | "right" | "auto"; // alignment relative to toggle or anchor
  offsetX?: number; // horizontal offset in px (used for portal mode)
  offsetY?: number; // vertical offset in px (used for portal mode)
  anchorRef?: React.RefObject<HTMLElement>; // anchor element to align to (portal mode)
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

  // Close when clicking outside (works for both in-place and portal)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const inMenu = dropdownRef.current?.contains(target);
      // consider toggle button (.dropdown-toggle) as inside
      const inToggle = (target as HTMLElement).closest(".dropdown-toggle");
      if (!inMenu && !inToggle) onClose();
    };

    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Compute body-level fixed coordinates based on anchor (portal mode)
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
      left = rect.right + offsetX;
      if (left + menuRect.width + margin > vw) {
        left = rect.left - menuRect.width - offsetX;
      }
      // Clamp inside viewport
      if (left < margin) left = margin;
      if (left + menuRect.width > vw - margin) left = vw - margin - menuRect.width;
    }

    if (placement === "right") {
      if (left + menuRect.width > vw - margin) {
        left = Math.max(margin, vw - margin - menuRect.width);
      }
    }

    const topPreferred = rect.top + rect.height + offsetY;
    let top = topPreferred;
    // If bottom overflows, clamp
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
      if (anchorRef) computeCoords();
    });
  }, [isOpen, placement, offsetX, offsetY, anchorRef]);

  useEffect(() => {
    if (!isOpen || !anchorRef) return;
    const onResize = () => computeCoords();
    const onScroll = () => computeCoords();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [isOpen, anchorRef]);

  if (!isOpen || !mounted) return null;

  // If an anchorRef is present, render via portal using fixed coords (keeps current behavior)
  if (anchorRef) {
    const menu = (
      <div
        ref={dropdownRef}
        style={{
          position: "fixed",
          top: coords?.top ?? 0,
          left: coords?.left ?? 0,
        }}
        className={`z-[1000] rounded-xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark ${className}`}
        role="menu"
      >
        {children}
      </div>
    );
    return createPortal(menu, document.body);
  }

  // Otherwise render in-place as absolute so it sits relative to the nearest positioned ancestor
  const posClass =
    placement === "left" ? "left-0" : placement === "right" ? "right-0" : "right-0";
  return (
    <div
      ref={dropdownRef}
      className={`absolute z-50 mt-2 ${posClass} rounded-xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark ${className}`}
      role="menu"
    >
      {children}
    </div>
  );
};

export default Dropdown;
