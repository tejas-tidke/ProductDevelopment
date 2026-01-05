import React, { useState } from "react";
import SettingsDropdown from "../../components/header/ui/SettingsDropdown";
import UserDropdown from "../../components/header/ui/UserDropdown";

interface SidebarDropdownProps {
  type: 'settings' | 'profile';
  isOpen: boolean;
  onToggle: () => void;
  isExpanded: boolean;
  isHovered: boolean;
  isMobileOpen: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const SidebarDropdown: React.FC<SidebarDropdownProps> = ({
  type,
  isOpen,
  onToggle,
  isExpanded,
  isHovered,
  isMobileOpen,
  isAdmin,
  isSuperAdmin
}) => {
  const shouldRenderSettings = type === 'settings' && (isAdmin || isSuperAdmin);
  const shouldRenderProfile = type === 'profile';

  if (type === 'settings' && !shouldRenderSettings) {
    return null;
  }

  return (
    <div 
      className="menu-item group relative" 
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center">
        <div className="relative">
          {type === 'settings' ? (
            <SettingsDropdown
              isOpen={isOpen}
              onToggle={onToggle}
            />
          ) : (
            <UserDropdown
              isOpen={isOpen}
              onToggle={onToggle}
            />
          )}
        </div>
        {(isExpanded || isHovered || isMobileOpen) && (
          <span className="menu-item-text ml-3 text-gray-900 dark:text-white">
            {type === 'settings' ? 'Settings' : 'Profile'}
          </span>
        )}
      </div>
    </div>
  );
};

export default SidebarDropdown;