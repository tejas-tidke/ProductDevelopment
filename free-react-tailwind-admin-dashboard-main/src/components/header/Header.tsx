import React from "react";
import { Link } from "react-router";
import CreateIssueModal from "../modals/CreateIssueModal";
import { useHeaderState } from "../header/logic/useHeaderState";
import { useSearchHandler } from "../header/logic/useSearchHandler";
import { useSidebar } from "../../context/SidebarContext";
import { ToggleSidebarButton } from "../header/ui/ToggleSidebarButton";
import { MobileMenuButton } from "../header/ui/MobileMenuButton";
import { SearchBar } from "../header/ui/SearchBar";
import { CreateRequestButton } from "../header/ui/CreateRequestButton";
import { HeaderActions } from "../header/ui/HeaderActions";

const Header: React.FC = () => {
  const { isExpanded } = useSidebar();
  
  const {
    // State
    isApplicationMenuOpen,
    isCreateModalOpen,
    initialContractType,
    initialExistingContractId,
    isMobileOpen,
    
    // Actions
    setIsCreateModalOpen,
    setInitialContractType,
    setInitialExistingContractId,
    handleToggle,
    toggleApplicationMenu
  } = useHeaderState();

  const { inputRef } = useSearchHandler();

  return (
    <header className="sticky top-0 flex w-full bg-indigo-200 border-gray-200 z-50 dark:border-gray-800 dark:bg-gray-900 lg:border-b">
      <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">
        <div className="flex items-center justify-between w-full gap-2 px-3 py-3 border-b border-gray-200 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
          <ToggleSidebarButton isMobileOpen={isMobileOpen} isExpanded={isExpanded} onClick={handleToggle} />

          <Link to="/dashboard" className="lg:hidden">
            <img
              className="dark:hidden"
              src="./images/logo/auth-logo1.svg"
              alt="Logo"
            />
            <img
              className="hidden dark:block"
              src="./images/logo/auth-logo1.svg"
              alt="Logo"
            />
          </Link>

          <MobileMenuButton onClick={toggleApplicationMenu} />

          <div className="hidden lg:flex items-center gap-2">
            <SearchBar inputRef={inputRef as React.RefObject<HTMLInputElement>} />
            <CreateRequestButton 
              onClick={() => { 
                setInitialContractType(undefined); 
                setInitialExistingContractId(undefined); 
                setIsCreateModalOpen(true); 
              }} 
            />
          </div>
        </div>
        <div
          className={`${
            isApplicationMenuOpen ? "flex" : "hidden"
          } items-center justify-between w-full gap-4 px-5 py-4 lg:flex shadow-theme-md lg:justify-end lg:px-0 lg:shadow-none`}
        >
          <HeaderActions />
        </div>
      </div>

      {/* Create Issue Modal */}
      <CreateIssueModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onIssueCreated={(issue) => {
          console.log("Created issue:", issue);
        }}
        initialContractType={initialContractType}
        initialExistingContractId={initialExistingContractId}
      />
    </header>
  );
};

export default Header;