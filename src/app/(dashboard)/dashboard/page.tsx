"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Mail, FileText, PenTool, Loader2 } from "lucide-react";

interface DashboardStats {
  activeAffaires: number;
  unreadEmails: number;
  pendingRequests: number;
  pendingSignatures: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const t = useTranslations("dashboard");

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const kpis = [
    {
      label: t("activeAffaires"),
      value: stats?.activeAffaires ?? 0,
      icon: Briefcase,
      color: "text-accent",
    },
    {
      label: t("unreadEmails"),
      value: stats?.unreadEmails ?? 0,
      icon: Mail,
      color: "text-info",
    },
    {
      label: t("pendingRequests"),
      value: stats?.pendingRequests ?? 0,
      icon: FileText,
      color: "text-accent",
    },
    {
      label: t("pendingSignatures"),
      value: stats?.pendingSignatures ?? 0,
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
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  {loading ? (
                    <Loader2 className="w-5 h-5 mt-2 animate-spin text-muted-foreground" />
                  ) : (
                    <p className="text-3xl font-bold mt-1">{kpi.value}</p>
                  )}
                </div>
                <kpi.icon className={`w-8 h-8 ${kpi.color} opacity-80`} />
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
