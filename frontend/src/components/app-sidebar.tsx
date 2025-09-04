import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Bot,
  Command,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
 
  navMain: [
    {
      title: "Dashboard",
      url: "/homepage",
      icon: SquareTerminal,
    },
    {
      title: "Expenses",
      url: null,
      icon: BookOpen,
      items: [
        { title: "Add Expense", url: "/manage" },
        { title: "View Expenses", url: "/view" },
      ],
    },
    {
      title: "Budgets",
      url: null,
      icon: PieChart,
      items: [
        { title: "Set Budget", url: "/budget" },
      ]
    },
    {
      title: "Groups",
      url: null,
      icon: Frame,
      items: [
        { title: "Create Group", url: "/group" },
        { title: "My Groups", url: "/viewgroup" },
      ],
    },
    {
      title: "Your Invites",
      url: "/invites",
      icon: Send,
    },
    {
      title: "Assistant",
      url: "/assistant",
      icon: Bot,
    },
    {
      title: "Your Active Events",
      url: "/active-events",
      icon: Settings2,
    },
  ],
  
  projects: [],
};

export function AppSidebar({ ...props }) {
  const navigate = useNavigate();

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <button
                onClick={() => navigate("/homepage")}
                className="flex w-full items-center gap-2"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Splitly</span>
                  
                </div>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} navigate={navigate} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
