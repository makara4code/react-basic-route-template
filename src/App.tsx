import { RouterProvider } from "react-router/dom";
import { router } from "./routes";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import TokenDebugPanel from "@/components/TokenDebugPanel";
import SecurityDebugPanel from "@/components/SecurityDebugPanel";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
        <TokenDebugPanel />
        <SecurityDebugPanel />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
