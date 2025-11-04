// src/hooks/useUsers.ts
import { useState, useEffect } from "react";
import { userApi } from "../services/api";

export interface User {
  id: string;
  email: string;
  displayName: string;
  disabled: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastSignInTime: string;
  photoURL?: string;
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await userApi.getAllUsers();
      setUsers(data);
    } catch (err) {
      const errorMessage = (err as Error).message || "Failed to fetch users";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: { email: string; password: string; displayName: string }) => {
    setLoading(true);
    setError(null);
    
    try {
      const newUser = await userApi.createUser(userData);
      setUsers(prev => [...prev, newUser]);
      return { user: newUser, error: null };
    } catch (err) {
      const errorMessage = (err as Error).message || "Failed to create user";
      setError(errorMessage);
      return { user: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id: string, userData: Partial<User>) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedUser = await userApi.updateUser(id, userData);
      setUsers(prev => prev.map(user => user.id === id ? updatedUser : user));
      return { user: updatedUser, error: null };
    } catch (err) {
      const errorMessage = (err as Error).message || "Failed to update user";
      setError(errorMessage);
      return { user: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await userApi.deleteUser(id);
      setUsers(prev => prev.filter(user => user.id !== id));
      return { success: true, error: null };
    } catch (err) {
      const errorMessage = (err as Error).message || "Failed to delete user";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, loading, error, fetchUsers, createUser, updateUser, deleteUser };
};