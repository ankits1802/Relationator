
"use client";

import { DatabaseZap, PanelLeft, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AppHeader() {
  return (
    <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-30 h-[60px] flex items-center">
      <div className="w-full max-w-5xl mx-auto px-4 flex items-center">
        <SidebarTrigger className="mr-2 text-primary-foreground hover:bg-primary/80 focus-visible:ring-primary-foreground" />
        
        <Link href="/" className="flex items-center gap-2">
          <DatabaseZap size={28} />
          <h1 className="text-xl font-bold hidden sm:block">Relationator</h1>
        </Link>

        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
