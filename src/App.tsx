import { RouterProvider } from "react-router/dom";
import { router } from "./routes";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import TokenDebugPanel from "@/components/TokenDebugPanel";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
        <TokenDebugPanel />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
