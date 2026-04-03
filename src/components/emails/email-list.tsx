"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Paperclip, Star } from "lucide-react";

export interface EmailItem {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  body: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachment: boolean;
  receivedAt: string;
  aiClassification?: string | null;
  aiSuggestion?: string | null;
}

interface EmailListProps {
  emails: EmailItem[];
  selectedId: string | null;
  onSelect: (email: EmailItem) => void;
  search: string;
  onSearchChange: (value: string) => void;
  loading: boolean;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const classificationColors: Record<string, string> = {
  appel_offres: "bg-info/20 text-info",
  chantier: "bg-success/20 text-success",
  fournisseur: "bg-accent/20 text-accent",
  administratif: "bg-danger/20 text-danger",
};

export function EmailList({
  emails,
  selectedId,
  onSelect,
  search,
  onSearchChange,
  loading,
}: EmailListProps) {
  const t = useTranslations("emails");

  return (
    <div className="flex flex-col h-full border-r border-border">
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : emails.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            {t("noEmails")}
          </div>
        ) : (
          <ul>
            {emails.map((email) => (
              <li key={email.id}>
                <button
                  onClick={() => onSelect(email)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-border transition-colors hover:bg-elevated",
                    selectedId === email.id && "bg-elevated",
                    !email.isRead && "bg-accent/5"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-elevated flex items-center justify-center shrink-0 text-xs font-medium">
                      {getInitials(email.from || email.fromEmail || "?")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "text-sm truncate",
                            !email.isRead && "font-semibold"
                          )}
                        >
                          {email.from || email.fromEmail}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTime(email.receivedAt)}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "text-sm truncate",
                          !email.isRead
                            ? "text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {email.subject || "(no subject)"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {email.body?.slice(0, 100)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {email.isStarred && (
                          <Star className="w-3 h-3 text-accent fill-accent" />
                        )}
                        {email.hasAttachment && (
                          <Paperclip className="w-3 h-3 text-muted-foreground" />
                        )}
                        {email.aiClassification && (
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[10px] px-1.5 py-0",
                              classificationColors[email.aiClassification] ??
                                ""
                            )}
                          >
                            {email.aiClassification}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
