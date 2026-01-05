import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router";
import { ChevronDownIcon } from "../../icons";

interface NavItem {
  name: string;
  icon: React.ReactNode | null;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
}

interface SidebarMenuItemProps {
  nav: NavItem;
  index: number;
  menuType: "main" | "others";
  openSubmenu: { type: "main" | "others"; index: number } | null;
  handleSubmenuToggle: (index: number, menuType: "main" | "others") => void;
  subMenuRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  subMenuHeight: Record<string, number>;
  isExpanded: boolean;
  isHovered: boolean;
  isMobileOpen: boolean;
  iconColor: string; // ✅ REQUIRED
}

const SidebarMenuItem: React.FC<SidebarMenuItemProps> = ({
  nav,
  index,
  menuType,
  openSubmenu,
  handleSubmenuToggle,
  subMenuRefs,
  subMenuHeight,
  isExpanded,
  isHovered,
  iconColor, // ✅ REQUIRED
  isMobileOpen
}) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {nav.name === "search-bar" ? (
        // Special case: Render search bar instead of navigation item
        <div className="menu-item group menu-item-inactive">
          <div className="flex items-center flex-1">
            <div className="menu-item-icon-size menu-item-icon-inactive">
              <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {(isExpanded || isHovered || isMobileOpen) && (
              <div className="flex-1 ml-3">
                <input
                  type="text"
                  placeholder="Evaluate a Tool"
                  className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </div>
        </div>
      ) : nav.subItems ? (
        <div
          className={`menu-item group ${
            openSubmenu?.type === menuType && openSubmenu?.index === index
              ? "menu-item-active"
              : "menu-item-inactive"
          } cursor-pointer ${
            !isExpanded && !isHovered
              ? "lg:justify-center"
              : "lg:justify-start"
          } overflow-visible relative flex items-center`}
        >
          <button
            onClick={() => {
              handleSubmenuToggle(index, menuType);
            }}
            className="flex items-center flex-1 bg-transparent border-0 p-0 cursor-pointer"
          >
            <span
              className={`menu-item-icon-size  ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-icon-active"
                  : "menu-item-icon-inactive"
              }`}
               style={{ color: iconColor }} // ✅ parent-controlled
            >
              {nav.icon || <div className="w-5 h-5" />}
            </span>
            {(isExpanded || isHovered || isMobileOpen) && (
              <span className="flex-1 text-left text-sm font-medium ml-3">{nav.name}</span>
            )}
            {(isExpanded || isHovered || isMobileOpen) && nav.subItems && (
              <div className="ml-auto flex items-center gap-2">
                {nav.name === "Project" && (
                  <span
                    className="flex items-center justify-center w-6 h-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-sm transition-colors cursor-pointer"
                    title="Create New Project"
                  >
                    +
                  </span>
                )}
                <ChevronDownIcon
                  className={`w-5 h-5 transition-transform duration-200 flex-shrink-0 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              </div>
            )}
          </button>
        </div>
      ) : (
        nav.path && (
          <Link
            to={nav.path}
            className={`menu-item group ${
              isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
            }`}
          >
            <span
              className={`menu-item-icon-size ${
                isActive(nav.path)
                  ? "menu-item-icon-active"
                  : "menu-item-icon-inactive"
              }`}
               style={{ color: iconColor }} // ✅ parent-controlle
            >
              {nav.icon || <div className="w-5 h-5" />}
            </span>
            {(isExpanded || isHovered || isMobileOpen) && (
              <span className="menu-item-text ml-3">{nav.name}</span>
            )}
          </Link>
        )
      )}
    </>
  );
};

export default SidebarMenuItem;