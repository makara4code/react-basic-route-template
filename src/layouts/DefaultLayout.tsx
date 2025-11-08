import { Link, Outlet, useLocation } from "react-router";
import { Home, Info, Users, LayoutDashboard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/about", label: "About", icon: Info },
  { path: "/users", label: "Users", icon: Users },
  { path: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/app/settings", label: "Settings", icon: Settings },
];

export default function DefaultLayout() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto flex h-16 items-center px-4">
          {/* Logo/Brand */}
          <div className="mr-8 flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">R</span>
            </div>
            <span className="hidden font-bold sm:inline-block">
              React App
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="flex flex-1 items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline-block">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Optional: Right side actions */}
          <div className="flex items-center gap-2">
            {/* You can add theme toggle, user menu, etc. here */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/40 bg-muted/50">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} React App. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
