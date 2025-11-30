import { createBrowserRouter, type RouteObject } from "react-router";
import Home from "./views/Home";
import About from "./views/About";
import DefaultLayout from "./layouts/DefaultLayout";
import Dashboard from "./views/Dashboard";
import Settings from "./views/Settings";
import UserList from "./views/Users";
import Login from "./views/auth/Login";
import { AuthGuard } from "./components/AuthGuard";

/**
 * Application Routes Configuration
 *
 * Routes are organized into two main groups:
 * 1. Public routes with DefaultLayout (navbar + content)
 * 2. App routes without layout (standalone pages)
 */
const routes: RouteObject[] = [
  {
    // Routes with DefaultLayout (includes navigation header)
    Component: DefaultLayout,
    children: [
      {
        index: true, // Home page at "/"
        Component: Home,
      },
      {
        path: "about",
        Component: About,
      },
      {
        path: "users",
        Component: UserList,
      },
    ],
  },
  {
    // Protected app routes (requires authentication)
    path: "/app",
    Component: AuthGuard,
    children: [
      {
        path: "dashboard", // Accessible at "/app/dashboard"
        Component: Dashboard,
      },
      {
        path: "settings", // Accessible at "/app/settings"
        Component: Settings,
      },
    ],
  },
  {
    path: "/login",
    Component: Login,
  },
];

export const router = createBrowserRouter(routes);
