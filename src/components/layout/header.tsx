"use client";

import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Sun, Moon, LogOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession();
  const t = useTranslations("auth");
  const { setTheme, resolvedTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 border-b border-border bg-surface/80 backdrop-blur-sm">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-md hover:bg-elevated"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            setTheme(resolvedTheme === "dark" ? "light" : "dark")
          }
          aria-label="Toggle theme"
        >
          {resolvedTheme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </Button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-md hover:bg-elevated"
          >
            <Avatar className="w-8 h-8">
              {session?.user?.image && (
                <AvatarImage
                  src={session.user.image}
                  alt={session.user.name ?? ""}
                />
              )}
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-border bg-surface shadow-lg py-1">
              <div className="px-4 py-2 border-b border-border">
                <p className="text-sm font-medium truncate">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {session?.user?.email}
                </p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-danger hover:bg-elevated"
              >
                <LogOut className="w-4 h-4" />
                {t("logout")}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
