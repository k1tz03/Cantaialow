"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { EmailSidebar } from "@/components/emails/email-sidebar";
import { EmailList, type EmailItem } from "@/components/emails/email-list";
import { EmailDetail } from "@/components/emails/email-detail";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EmailsPage() {
  const { data: session } = useSession();
  const t = useTranslations("emails");
  const [activeFolder, setActiveFolder] = useState("INBOX");
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

  const emailConnected = session?.user ? true : false; // Would check emailConnected from user data

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        folder: activeFolder,
        search,
      });
      const res = await fetch(`/api/email/list?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails ?? []);
      }
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, [activeFolder, search]);

  useEffect(() => {
    if (emailConnected) {
      fetchEmails();
    }
  }, [emailConnected, fetchEmails]);

  const handleSelectEmail = (email: EmailItem) => {
    setSelectedEmail(email);
    setMobileView("detail");
  };

  if (!emailConnected) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <Mail className="w-12 h-12 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-display font-bold">
              {t("connectEmail")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("connectEmail")}
            </p>
            <Link href="/settings">
              <Button>{t("connectEmail")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] -m-4 md:-m-6">
      {/* Desktop: 3 columns */}
      <div className="hidden lg:flex h-full w-full">
        <EmailSidebar
          activeFolder={activeFolder}
          onFolderChange={setActiveFolder}
          unreadCount={emails.filter((e) => !e.isRead).length}
          draftsCount={0}
        />
        <div className="w-[340px] min-w-[300px]">
          <EmailList
            emails={emails}
            selectedId={selectedEmail?.id ?? null}
            onSelect={handleSelectEmail}
            search={search}
            onSearchChange={setSearch}
            loading={loading}
          />
        </div>
        <EmailDetail email={selectedEmail} />
      </div>

      {/* Mobile: list or detail */}
      <div className="flex lg:hidden h-full w-full">
        {mobileView === "list" ? (
          <div className="flex flex-col w-full">
            <div className="border-b border-border p-2 flex gap-1 overflow-x-auto">
              {["INBOX", "SENT", "DRAFTS"].map((f) => (
                <Button
                  key={f}
                  variant={activeFolder === f ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveFolder(f)}
                >
                  {f === "INBOX"
                    ? t("inbox")
                    : f === "SENT"
                    ? t("sent")
                    : t("drafts")}
                </Button>
              ))}
            </div>
            <EmailList
              emails={emails}
              selectedId={null}
              onSelect={handleSelectEmail}
              search={search}
              onSearchChange={setSearch}
              loading={loading}
            />
          </div>
        ) : (
          <div className="flex flex-col w-full">
            <div className="p-2 border-b border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMobileView("list");
                  setSelectedEmail(null);
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                {t("inbox")}
              </Button>
            </div>
            <EmailDetail email={selectedEmail} />
          </div>
        )}
      </div>
    </div>
  );
}
