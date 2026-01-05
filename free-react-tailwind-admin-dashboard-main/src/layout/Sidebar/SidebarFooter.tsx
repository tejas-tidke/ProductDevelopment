import React, { useState } from "react";
import SidebarDropdown from "./SidebarDropdown";

interface SidebarFooterProps {
  isExpanded: boolean;
  isHovered: boolean;
  isMobileOpen: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const SidebarFooter: React.FC<SidebarFooterProps> = ({
  isExpanded,
  isHovered,
  isMobileOpen,
  isAdmin,
  isSuperAdmin
}) => {
  const [openBottomDropdown, setOpenBottomDropdown] = useState<'notifications' | 'settings' | 'profile' | null>(null);

  return (
    <div className="flex-shrink-0 pb-4 px-5">
      <div className="flex flex-col gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        {/* Settings - Only visible for Admin and Super Admin */}
        {(isAdmin || isSuperAdmin) && (
          <SidebarDropdown
            type="settings"
            isOpen={openBottomDropdown === 'settings'}
            onToggle={() => setOpenBottomDropdown(openBottomDropdown === 'settings' ? null : 'settings')}
            isExpanded={isExpanded}
            isHovered={isHovered}
            isMobileOpen={isMobileOpen}
            isAdmin={isAdmin}
            isSuperAdmin={isSuperAdmin}
          />
        )}

        {/* Profile */}
        <SidebarDropdown
          type="profile"
          isOpen={openBottomDropdown === 'profile'}
          onToggle={() => setOpenBottomDropdown(openBottomDropdown === 'profile' ? null : 'profile')}
          isExpanded={isExpanded}
          isHovered={isHovered}
          isMobileOpen={isMobileOpen}
          isAdmin={isAdmin}
          isSuperAdmin={isSuperAdmin}
        />
      </div>
    </div>
  );
};

export default SidebarFooter;