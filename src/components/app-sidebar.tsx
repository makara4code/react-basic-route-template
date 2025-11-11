import * as React from "react";
import {
  LayoutDashboard,
  Settings,
  Users,
  FileText,
  BarChart3,
  Home,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";

// Navigation data with actual routes
const data = {
  teams: [
    {
      name: "React App",
      logo: Home,
      plan: "Pro",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/app/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Settings",
      url: "/app/settings",
      icon: Settings,
    },
  ],
  projects: [
    {
      name: "Analytics",
      url: "/app/analytics",
      icon: BarChart3,
    },
    {
      name: "Documents",
      url: "/app/documents",
      icon: FileText,
    },
    {
      name: "Team",
      url: "/app/team",
      icon: Users,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();

  // Use user data from auth context (already fetched by /auth/me)
  // No need to fetch again - this eliminates duplicate requests!

  const userData = {
    name:
      user?.first_name && user?.last_name
        ? `${user.first_name} ${user.last_name}`
        : user?.email?.split("@")[0] || "User",
    email: user?.email || "user@example.com",
    avatar: user?.avatar || "",
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
