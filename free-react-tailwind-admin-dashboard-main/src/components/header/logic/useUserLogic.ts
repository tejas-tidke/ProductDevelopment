import { useState, useEffect } from "react";
import { useSignOut } from "../../../hooks/useSignOut";
import { userService } from "../../../services/userService";
import { User } from "firebase/auth";

export const useUserLogic = (currentUser: User | null) => {
  const [userAvatar, setUserAvatar] = useState<string>("/images/user/user-01.jpg");
  const [userDisplayName, setUserDisplayName] = useState<string>("User");
  const [userEmail, setUserEmail] = useState<string>("");
  const { signOut } = useSignOut();

  // Load user data from backend
  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser?.uid) {
        try {
          setUserEmail(currentUser.email || "");

          // Use display name from Firebase or email prefix
          const displayName = currentUser.displayName || currentUser.email?.split("@")[0] || "User";
          setUserDisplayName(displayName);

          // Fetch user data from backend to get avatar
          const userData = await userService.getUserData(currentUser.uid);
          if (userData && userData.user && userData.user.avatar) {
            setUserAvatar(userData.user.avatar);
          } else {
            // Use default avatar if none found
            setUserAvatar("/images/user/user-01.jpg");
          }
        } catch (error) {
          console.error("Failed to load user data:", error);
          // Use default values on error
          setUserAvatar("/images/user/user-01.jpg");
          const displayName = currentUser.displayName || currentUser.email?.split("@")[0] || "User";
          setUserDisplayName(displayName);
          setUserEmail(currentUser.email || "");
        }
      }
    };

    loadUserData();
  }, [currentUser]);

  const handleSignOut = async (navigate: (path: string) => void, closeDropdown: () => void) => {
    const { success } = await signOut();
    if (success) {
      // Redirect to sign in page after successful sign out
      navigate("/signin");
    }
    closeDropdown();
  };

  return {
    userAvatar,
    userDisplayName,
    userEmail,
    handleSignOut,
    setUserAvatar,
    setUserDisplayName,
    setUserEmail
  };
};