"use client";

import { useTranslations } from "next-intl";
import {
  Globe,
  Handshake,
  Target,
  Star,
  PenTool,
  Megaphone,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const strategyIcons = [Globe, Handshake, Target, Star, PenTool, Megaphone] as const;

const strategyKeys = [
  "digitalPresence",
  "professionalNetwork",
  "commercialProspection",
  "reputation",
  "contentMarketing",
  "paidAdvertising",
] as const;

const actionCounts = [4, 4, 4, 4, 4, 4];

const metricKeys = [
  "websiteVisitors",
  "leadsGenerated",
  "proposalsSent",
  "conversionRate",
] as const;

export default function DistributionPage() {
  const t = useTranslations("distribution");

  return (
    <div className="space-y-8">
      {/* Page title and intro */}
      <div className="space-y-2">
        <h1 className="text-2xl font-display font-bold">{t("title")}</h1>
        <p className="text-muted-foreground max-w-2xl">{t("intro")}</p>
      </div>

      {/* Strategy cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {strategyKeys.map((key, index) => {
          const Icon = strategyIcons[index];
          return (
            <Card key={key} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <CardTitle className="text-base">
                    {t(`strategies.${key}.title`)}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2">
                  {Array.from({ length: actionCounts[index] }).map((_, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="h-4 w-4 shrink-0 mt-0.5 text-accent" />
                      <span className="text-muted-foreground">
                        {t(`strategies.${key}.actions.${i}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Key Metrics to Track */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-display font-bold">{t("metrics.title")}</h2>
        </div>
        <p className="text-muted-foreground text-sm">{t("metrics.description")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricKeys.map((key) => (
            <Card key={key}>
              <CardContent className="pt-6">
                <div className="space-y-1">
                  <p className="text-2xl font-bold font-display text-accent">
                    {t(`metrics.${key}.value`)}
                  </p>
                  <p className="text-sm font-medium">
                    {t(`metrics.${key}.label`)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t(`metrics.${key}.description`)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-surface">
          <Badge variant="default">{t("metrics.funnelLabel")}</Badge>
          <p className="text-sm text-muted-foreground">{t("metrics.funnelDescription")}</p>
        </div>
      </div>
    </div>
  );
}
