import React from "react";
import { Link } from "react-router";

interface SidebarHeaderProps {
  isExpanded: boolean;
  isHovered: boolean;
  isMobileOpen: boolean;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ 
  isExpanded, 
  isHovered, 
  isMobileOpen 
}) => {
  return (
    <div
      className={`py-8 px-5 flex ${
        !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
      }`}
    >
      <Link to="/dashboard">
        {isExpanded || isHovered || isMobileOpen ? (
          <>
            <img
              className="dark:hidden"
              src="/images/logo/logo1.svg"
              alt="Logo"
              width={150}
              height={40}
            />
            <img
              className="hidden dark:block dark:invert dark:brightness-0 dark:contrast-100"
              src="/images/logo/logo1.svg"
              alt="Logo"
              width={150}
              height={40}
            />
          </>
        ) : (
          <img
            src="/images/logo/logo1.svg"
            alt="Logo"
            width={32}
            height={32}
          />
        )}
      </Link>
    </div>
  );
};

export default SidebarHeader;