"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Stats {
  aiCostToday: number;
  aiCostMonth: number;
  avgCostPerUser: number;
  cacheHitRate: number;
}

interface AiCallRow {
  id: string;
  feature: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  cacheHit: boolean;
  durationMs: number;
  createdAt: string;
}

export default function AdminAiCostsPage() {
  const t = useTranslations("admin");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [calls] = useState<AiCallRow[]>([]);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  const metrics = stats
    ? [
        { label: t("aiCostToday"), value: `$${stats.aiCostToday}` },
        { label: t("aiCostMonth"), value: `$${stats.aiCostMonth}` },
        { label: t("avgCostPerUser"), value: `$${stats.avgCostPerUser}` },
        { label: t("cacheHitRate"), value: `${stats.cacheHitRate}%` },
      ]
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">{t("aiCosts")}</h1>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
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
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((m) => (
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

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent AI Calls</CardTitle>
            </CardHeader>
            <CardContent>
              {calls.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No AI calls recorded yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-3 font-medium text-muted-foreground">
                          Feature
                        </th>
                        <th className="pb-3 font-medium text-muted-foreground">
                          Model
                        </th>
                        <th className="pb-3 font-medium text-muted-foreground">
                          Tokens (In/Out)
                        </th>
                        <th className="pb-3 font-medium text-muted-foreground">
                          Cost
                        </th>
                        <th className="pb-3 font-medium text-muted-foreground">
                          Cache
                        </th>
                        <th className="pb-3 font-medium text-muted-foreground">
                          Duration
                        </th>
                        <th className="pb-3 font-medium text-muted-foreground">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {calls.map((call) => (
                        <tr
                          key={call.id}
                          className="border-b border-border last:border-0"
                        >
                          <td className="py-3">{call.feature}</td>
                          <td className="py-3">
                            <Badge variant="secondary">{call.model}</Badge>
                          </td>
                          <td className="py-3">
                            {call.inputTokens} / {call.outputTokens}
                          </td>
                          <td className="py-3">${call.costUsd.toFixed(4)}</td>
                          <td className="py-3">
                            <Badge
                              variant={call.cacheHit ? "success" : "outline"}
                            >
                              {call.cacheHit ? "Hit" : "Miss"}
                            </Badge>
                          </td>
                          <td className="py-3">{call.durationMs}ms</td>
                          <td className="py-3 text-muted-foreground">
                            {new Date(call.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
