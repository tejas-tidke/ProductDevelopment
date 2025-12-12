import { useState, useEffect } from "react";
import { useSidebar } from "../../../context/SidebarContext";

export const useHeaderState = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [initialContractType, setInitialContractType] = useState<'new' | 'existing' | undefined>(undefined);
  const [initialExistingContractId, setInitialExistingContractId] = useState<string | undefined>(undefined);

  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };

  // Listen for external openCreateModal events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      if (detail && detail.existingContractId) {
        setInitialContractType('existing');
        setInitialExistingContractId(String(detail.existingContractId));
      } else {
        setInitialContractType(undefined);
        setInitialExistingContractId(undefined);
      }
      setIsCreateModalOpen(true);
    };
    window.addEventListener('openCreateModal', handler as EventListener);
    return () => window.removeEventListener('openCreateModal', handler as EventListener);
  }, []);

  return {
    // State
    isApplicationMenuOpen,
    isCreateModalOpen,
    initialContractType,
    initialExistingContractId,
    isMobileOpen,
    
    // Actions
    setApplicationMenuOpen,
    setIsCreateModalOpen,
    setInitialContractType,
    setInitialExistingContractId,
    handleToggle,
    toggleApplicationMenu,
    toggleSidebar,
    toggleMobileSidebar
  };
};