"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Home, 
  Lightbulb, 
  Bookmark, 
  Settings, 
  BarChart3,
  Sparkles,
  Twitter
} from "lucide-react";
import { APP_CONFIG } from "@/lib/constants";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "Inspirations",
    href: "/dashboard/inspirations",
    icon: Lightbulb,
  },
  {
    name: "Saved Content",
    href: "/dashboard/saved",
    icon: Bookmark,
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold">{APP_CONFIG.name}</span>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Button
                key={item.name}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive && "bg-secondary font-medium"
                )}
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Link>
              </Button>
            );
          })}
        </nav>

        <Separator className="my-4" />

        {/* Quick Actions */}
        <div className="space-y-2">
          <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Quick Actions
          </p>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/dashboard/inspirations">
              <Twitter className="mr-2 h-4 w-4" />
              Find Tweets
            </Link>
          </Button>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground text-center">
          {APP_CONFIG.name} v{APP_CONFIG.version}
        </p>
      </div>
    </div>
  );
}
