"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Mail, FileText, PenTool } from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const t = useTranslations("dashboard");

  const stats = [
    {
      label: t("activeAffaires"),
      value: "0",
      icon: Briefcase,
      color: "text-accent",
    },
    {
      label: t("unreadEmails"),
      value: "0",
      icon: Mail,
      color: "text-info",
    },
    {
      label: t("pendingRequests"),
      value: "0",
      icon: FileText,
      color: "text-accent",
    },
    {
      label: t("pendingSignatures"),
      value: "0",
      icon: PenTool,
      color: "text-success",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">
        {t("welcome", { name: session?.user?.name || "" })}
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("recentActivity")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t("noActivity")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("aiSuggestions")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t("noActivity")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
