"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Stats {
  totalUsers: number;
  activeUsersThisMonth: number;
  newUsersToday: number;
  newUsersWeek: number;
  mrr: number;
  aiCostToday: number;
  aiCostMonth: number;
  avgCostPerUser: number;
  cacheHitRate: number;
}

export default function AdminPage() {
  const t = useTranslations("admin");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display font-bold">{t("title")}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-elevated rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-elevated rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const userMetrics = [
    { label: t("totalUsers"), value: stats?.totalUsers ?? 0 },
    { label: t("activeUsers"), value: stats?.activeUsersThisMonth ?? 0 },
    { label: "New today", value: stats?.newUsersToday ?? 0 },
    { label: t("mrr"), value: `$${stats?.mrr ?? 0}` },
  ];

  const aiMetrics = [
    { label: t("aiCostToday"), value: `$${stats?.aiCostToday ?? 0}` },
    { label: t("aiCostMonth"), value: `$${stats?.aiCostMonth ?? 0}` },
    { label: t("avgCostPerUser"), value: `$${stats?.avgCostPerUser ?? 0}` },
    { label: t("cacheHitRate"), value: `${stats?.cacheHitRate ?? 0}%` },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">{t("title")}</h1>

      <div>
        <h2 className="text-lg font-semibold mb-3">{t("users")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {userMetrics.map((m) => (
            <Card key={m.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {m.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{m.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">{t("aiCosts")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {aiMetrics.map((m) => (
            <Card key={m.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {m.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{m.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
