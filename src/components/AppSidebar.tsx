
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, DatabaseZap, Binary, GitCompareArrows, GitMergeIcon, SigmaIcon, FunctionSquare, ArrowLeft } from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export default function AppSidebar() {
  const pathname = usePathname();
  const { state, mounted, defaultOpenInitial } = useSidebar();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const menuItems = [
    { 
      id: 'back-to-project', 
      label: 'Back to Project', 
      icon: ArrowLeft, 
      href: "https://6000-firebase-studio-1747578327375.cluster-zkm2jrwbnbd4awuedc2alqxrpk.cloudworkstations.dev/",
      external: false, // Changed to false to open in the same tab
    },
    { id: 'dashboard', href: '/', label: 'Dashboard', icon: HomeIcon },
    { id: 'relationator', href: '/relationator', label: 'Relationator', icon: Binary },
    { id: 'fd-equivalence', href: '/fd-equivalence', label: 'FD Equivalence', icon: GitCompareArrows },
    { id: 'decomposition-checker', href: '/decomposition-checker', label: 'Decomposition', icon: GitMergeIcon },
    { id: 'ra-query-tool', href: '/relational-algebra', label: 'RA Query Tool', icon: FunctionSquare },
  ];

  if (!isClient && !mounted) {
    return (
      <div className="border-r h-screen w-[var(--sidebar-width)] group peer md:block text-sidebar-foreground"
           data-state={defaultOpenInitial ? "expanded" : "collapsed"}
           data-collapsible={defaultOpenInitial ? "" : "icon"}
           data-variant="sidebar"
           data-side="left">
        <SidebarHeader className={cn("flex items-center gap-2 p-2 h-[60px]", !defaultOpenInitial && "justify-center")}>
            <DatabaseZap size={28} className="text-primary flex-shrink-0" />
            {defaultOpenInitial && <h2 className="text-xl font-semibold text-primary">Relationator</h2>}
        </SidebarHeader>
        <SidebarContent className="pt-4">
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.id} className="group/menu-item relative">
                <div className={cn("peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm h-8 animate-pulse bg-muted/50", !defaultOpenInitial && "!size-8 !p-0")}>
                  <div className={cn("h-5 w-5 flex-shrink-0 bg-muted/80 rounded", !defaultOpenInitial && "mx-auto")}></div>
                  {!defaultOpenInitial && <span className="sr-only">{item.label}</span>}
                  {defaultOpenInitial && <div className="h-4 w-20 bg-muted/80 rounded"></div>}
                </div>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </div>
    );
  }

  const effectiveState = mounted ? state : (defaultOpenInitial ? "expanded" : "collapsed");

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="border-r"
    >
      <SidebarHeader className={cn("flex items-center gap-2 p-2 h-[60px]", effectiveState === "collapsed" && "justify-center")}>
        <DatabaseZap size={28} className="text-primary flex-shrink-0" />
        {effectiveState === "expanded" && (
          <h2 className="text-xl font-semibold text-primary">Relationator</h2>
        )}
      </SidebarHeader>
      <SidebarContent className="pt-4">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              {item.href ? (
                <SidebarMenuButton
                  asChild
                  isActive={item.external ? false : pathname === item.href} 
                  tooltip={item.label}
                  className={cn(
                    "w-full",
                    effectiveState === "expanded" ? "justify-start" : "justify-center"
                  )}
                >
                  <Link 
                    href={item.href} 
                    className={cn(
                      "flex items-center w-full",
                      effectiveState === "expanded" ? "justify-start" : "justify-center"
                    )}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                  >
                    <item.icon className={cn("h-5 w-5 flex-shrink-0", effectiveState === "expanded" ? "mr-2" : "")} />
                    <span className={cn(effectiveState === "collapsed" && "sr-only")}>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              ) : ( 
                <SidebarMenuButton
                  onClick={(item as any).onClick} 
                  tooltip={item.label}
                  className={cn(
                    "w-full",
                    effectiveState === "expanded" ? "justify-start" : "justify-center"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 flex-shrink-0", effectiveState === "expanded" ? "mr-2" : "")} />
                  <span className={cn(effectiveState === "collapsed" && "sr-only")}>{item.label}</span>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
