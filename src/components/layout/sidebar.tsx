"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  Mail,
  FileText,
  ScrollText,
  FolderOpen,
  Truck,
  CalendarDays,
  Bot,
  Settings,
  Shield,
  BookOpen,
  X,
} from "lucide-react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, labelKey: "dashboard" as const },
  { href: "/affaires", icon: Briefcase, labelKey: "affaires" as const },
  { href: "/emails", icon: Mail, labelKey: "emails" as const },
  { href: "/appels-offres", icon: FileText, labelKey: "appelsOffres" as const },
  { href: "/contrats", icon: ScrollText, labelKey: "contrats" as const },
  { href: "/documents", icon: FolderOpen, labelKey: "documents" as const },
  { href: "/fournisseurs", icon: Truck, labelKey: "fournisseurs" as const },
  { href: "/planning", icon: CalendarDays, labelKey: "planning" as const },
  { href: "/assistant", icon: Bot, labelKey: "assistant" as const },
  { href: "/settings", icon: Settings, labelKey: "settings" as const },
  { href: "/guide", icon: BookOpen, labelKey: "guide" as const },
];

const adminItems = [
  { href: "/admin", icon: LayoutDashboard, labelKey: "dashboard" as const },
  { href: "/admin/users", icon: Shield, labelKey: "users" as const },
  { href: "/admin/ai-costs", icon: Bot, labelKey: "aiCosts" as const },
  { href: "/admin/prompts", icon: FileText, labelKey: "prompts" as const },
  { href: "/admin/config", icon: Settings, labelKey: "config" as const },
  { href: "/admin/audit", icon: ScrollText, labelKey: "audit" as const },
];

export function Sidebar({ open, onClose, isAdmin }: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tAdmin = useTranslations("admin");
  const items = isAdmin ? adminItems : navItems;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-sidebar bg-surface border-r border-border flex flex-col transition-transform duration-150 ease-out lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={onClose}>
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm">C</span>
            </div>
            <span className="font-display font-bold text-lg">
              {isAdmin ? "Admin" : "ConductorOS"}
            </span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md hover:bg-elevated"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <ul className="space-y-1">
            {items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  item.href !== "/admin" &&
                  pathname.startsWith(item.href));
              const label = isAdmin
                ? tAdmin(item.labelKey)
                : t(item.labelKey);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent/10 text-accent"
                        : "text-muted-foreground hover:bg-elevated hover:text-foreground"
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            ConductorOS v0.1.0
          </div>
        </div>
      </aside>
    </>
  );
}
