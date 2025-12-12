import { useAuth } from "../../../context/AuthContext";

export const useSettingsLogic = () => {
  const { isAdmin, isSuperAdmin } = useAuth();

  return {
    isAdmin,
    isSuperAdmin
  };
};