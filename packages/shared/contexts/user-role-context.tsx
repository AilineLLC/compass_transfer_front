'use client';

import React, { createContext, useContext } from 'react';
import type { Role } from '@entities/users/enums';

interface UserRoleContextType {
  userRole: Role | null;
  userId: string | null;
  userFullName: string | null;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

interface UserRoleProviderProps {
  children: React.ReactNode;
  userRole: Role | null;
  userId: string | null;
  userFullName: string | null;
}

export function UserRoleProvider({ 
  children, 
  userRole, 
  userId, 
  userFullName 
}: UserRoleProviderProps) {
  return (
    <UserRoleContext.Provider value={{ userRole, userId, userFullName }}>
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole() {
  const context = useContext(UserRoleContext);

  if (context === undefined) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }

  return context;
}

// Хук для проверки, является ли пользователь админом
export function useIsAdmin() {
  const { userRole } = useUserRole();
  
  return userRole === 'Admin';
}
