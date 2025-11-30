import { RouterProvider } from "react-router/dom";
import { router } from "./routes";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
