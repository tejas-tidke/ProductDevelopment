import React from "react";
import { ThemeToggleButton } from "../../../components/common/ThemeToggleButton";
import NotificationDropdown from "../ui/NotificationDropdown";
// import SettingsDropdown from "./SettingsDropdown";
// import UserDropdown from "./UserDropdown";

export const HeaderActions: React.FC = () => {
  return (
    <div className="flex items-center gap-2 2xsm:gap-3">
      {/* <!-- Dark Mode Toggler --> */}
      <ThemeToggleButton />
      {/* <!-- Dark Mode Toggler --> */}
      
      {/* Notification Dropdown */}
      <NotificationDropdown />
      
      {/* Settings Dropdown */}
      {/* <SettingsDropdown /> */}
      
      {/* User Dropdown */}
      {/* <UserDropdown /> */}
    </div>
  );
};