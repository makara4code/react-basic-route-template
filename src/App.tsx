import { RouterProvider } from "react-router/dom";
import { router } from "./routes";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthPriovider } from "./contexts/AuthContext";

function App() {
  return (
    <ThemeProvider>
      <AuthPriovider>
        <RouterProvider router={router} />
      </AuthPriovider>
    </ThemeProvider>
  );
}

export default App;
