import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet } from "react-router";

export function AuthLayout() {
  const { username, email } = useAuth();
  console.log(username, email);

  const isAuthenticated = true;

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <Outlet />;
}
