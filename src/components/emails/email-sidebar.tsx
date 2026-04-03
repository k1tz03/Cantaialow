"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  Inbox,
  Send,
  FileEdit,
  Trash2,
  Plus,
  HardHat,
  Truck,
  ShieldAlert,
  Star,
} from "lucide-react";

interface EmailSidebarProps {
  activeFolder: string;
  onFolderChange: (folder: string) => void;
  unreadCount: number;
  draftsCount: number;
}

export function EmailSidebar({
  activeFolder,
  onFolderChange,
  unreadCount,
  draftsCount,
}: EmailSidebarProps) {
  const t = useTranslations("emails");

  const systemFolders = [
    { id: "INBOX", icon: Inbox, label: t("inbox"), badge: unreadCount },
    { id: "SENT", icon: Send, label: t("sent") },
    { id: "DRAFTS", icon: FileEdit, label: t("drafts"), badge: draftsCount },
    { id: "TRASH", icon: Trash2, label: t("trash") },
  ];

  const smartFolders = [
    { id: "smart_ao", icon: Star, label: t("appelsOffres") },
    { id: "smart_chantier", icon: HardHat, label: t("chantiersActifs") },
    { id: "smart_fournisseur", icon: Truck, label: t("fournisseursFolder") },
    { id: "smart_admin", icon: ShieldAlert, label: t("administratif") },
  ];

  return (
    <div className="w-full lg:w-sidebar lg:min-w-sidebar border-r border-border flex flex-col h-full bg-surface">
      <div className="p-3">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white rounded-md text-sm font-medium hover:bg-accent-hover transition-colors">
          <Plus className="w-4 h-4" />
          {t("compose")}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-1">
        <ul className="space-y-0.5">
          {systemFolders.map((folder) => (
            <li key={folder.id}>
              <button
                onClick={() => onFolderChange(folder.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  activeFolder === folder.id
                    ? "bg-accent/10 text-accent font-medium"
                    : "text-muted-foreground hover:bg-elevated hover:text-foreground"
                )}
              >
                <folder.icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{folder.label}</span>
                {folder.badge ? (
                  <span className="text-xs bg-accent text-white px-1.5 py-0.5 rounded-sm min-w-[20px] text-center">
                    {folder.badge}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-4 mb-2 px-3 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t("smartFolders")}
          </span>
        </div>

        <ul className="space-y-0.5">
          {smartFolders.map((folder) => (
            <li key={folder.id}>
              <button
                onClick={() => onFolderChange(folder.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  activeFolder === folder.id
                    ? "bg-accent/10 text-accent font-medium"
                    : "text-muted-foreground hover:bg-elevated hover:text-foreground"
                )}
              >
                <folder.icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{folder.label}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-4 mb-2 px-3 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t("myFolders")}
          </span>
          <button className="text-muted-foreground hover:text-accent">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>
    </div>
  );
}
