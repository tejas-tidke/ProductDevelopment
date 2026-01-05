import React from "react";
import { Link, useLocation } from "react-router";

interface NavItem {
  name: string;
  icon: React.ReactNode | null;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
}

interface SidebarSubMenuProps {
  nav: NavItem;
  index: number;
  menuType: "main" | "others";
  openSubmenu: { type: "main" | "others"; index: number } | null;
  subMenuRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  subMenuHeight: Record<string, number>;
  isExpanded: boolean;
  isHovered: boolean;
  isMobileOpen: boolean;
}

const SidebarSubMenu: React.FC<SidebarSubMenuProps> = ({
  nav,
  index,
  menuType,
  openSubmenu,
  subMenuRefs,
  subMenuHeight,
  isExpanded,
  isHovered,
  isMobileOpen
}) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  if (!nav.subItems || !(isExpanded || isHovered || isMobileOpen)) {
    return null;
  }

  const shouldRenderSubmenu = nav.name !== 'Project' && nav.name !== 'Issues';

  if (!shouldRenderSubmenu) {
    return null;
  }

  return (
    <div
      ref={(el) => {
        subMenuRefs.current[`${menuType}-${index}`] = el;
      }}
      className="overflow-hidden transition-all duration-300 relative z-20"
      style={{
        height:
          openSubmenu?.type === menuType && openSubmenu?.index === index
            ? `${subMenuHeight[`${menuType}-${index}`]}px`
            : "0px",
      }}
    >
      <ul className="mt-2 space-y-1 ml-9">
        {nav.subItems.map((subItem) => (
          <li key={subItem.path}>
            <Link
              to={subItem.path}
              className={`block px-4 py-2 text-sm rounded-md ${
                isActive(subItem.path)
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700/50"
              }`}
            >
              {subItem.name}
              {subItem.new && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                  New
                </span>
              )}
              {subItem.pro && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200">
                  Pro
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SidebarSubMenu;