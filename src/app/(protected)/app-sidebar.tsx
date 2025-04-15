"use client";

import {
  LayoutDashboard,
  MessageSquareText,
  Video,
  CreditCard,
  FolderKanban,
  PlusCircle,
  Github,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Navigation items
const mainNavItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "Q&A",
    icon: MessageSquareText,
    href: "/qa",
  },
  {
    title: "Meetings",
    icon: Video,
    href: "/meetings",
  },
  {
    title: "Billing",
    icon: CreditCard,
    href: "/billing",
  },
];

// Projects - This would typically come from your database
const projects = [
  { id: "1", name: "Project Alpha", href: "/projects/1" },
  { id: "2", name: "Project Beta", href: "/projects/2" },
  { id: "3", name: "Project Gamma", href: "/projects/3" },
];

function AppSidebar() {
  const pathname = usePathname();
  const { open } = useSidebar();
  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader>
        <div
          className={cn(
            "p-4",
            open ? "flex items-center gap-2" : "flex justify-center",
          )}
        >
          <Github className="h-5 w-5" />
          {open && <h1 className="text-lg font-bold">Github SaaS</h1>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {mainNavItems.map(({ title, icon: Icon, href }) => {
              const pathname = usePathname();
              const isActive = pathname === href;

              return (
                <SidebarMenuItem key={title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={title}
                    className={cn(isActive && "bg-black text-white")}
                  >
                    <Link href={href} className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        {/* Projects Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Your Projects</SidebarGroupLabel>
          <SidebarMenu>
            {projects.map((project) => (
              <SidebarMenuItem key={project.id}>
                <SidebarMenuButton asChild tooltip={project.name}>
                  <a href={project.href}>
                    <FolderKanban className="h-4 w-4" />
                    <span>{project.name}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {open && (<SidebarFooter>
        <div className="p-2">
          <Link href="/create-project">
            <Button className="w-full justify-start" size="lg">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </Link>
        </div>
      </SidebarFooter>)}

      <SidebarRail />
    </Sidebar>
  );
}

export default AppSidebar;
