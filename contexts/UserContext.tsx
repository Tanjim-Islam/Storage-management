"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface User {
  $id: string;
  fullName: string;
  email: string;
  avatar: string;
  accountId: string;
}

interface UserContextType {
  user: User | null;
  updateUser: (userData: Partial<User>) => void;
  setUser: (user: User) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser: User;
}) => {
  const [user, setUserState] = useState<User | null>(initialUser);

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUserState({ ...user, ...userData });
    }
  };

  const setUser = (newUser: User) => {
    setUserState(newUser);
  };

  return (
    <UserContext.Provider value={{ user, updateUser, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export default UserContext;
