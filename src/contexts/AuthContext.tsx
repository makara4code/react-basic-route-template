import { createContext, useContext, type PropsWithChildren } from "react";

type AuthContextType = {
  username: string;
  email: string;
};

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthPriovider({ children }: PropsWithChildren) {
  const contextValue = { username: "Makara", email: "test@gmail.com" };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used withing an AuthProvider");
  }

  return context;
}
