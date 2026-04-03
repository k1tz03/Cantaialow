"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Rocket } from "lucide-react";

const phases = [
  { key: "q1", featureCount: 3, completedCount: 3 },
  { key: "q2", featureCount: 3, completedCount: 1 },
  { key: "q3", featureCount: 3, completedCount: 0 },
  { key: "q4", featureCount: 3, completedCount: 0 },
] as const;

const statusVariants: Record<string, { variant: "success" | "default" | "secondary"; className?: string }> = {
  done: { variant: "success" },
  inProgress: { variant: "default", className: "bg-amber-500 border-amber-500" },
  planned: { variant: "secondary" },
};

export default function RoadmapPage() {
  const t = useTranslations("roadmap");

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
          <Rocket className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {phases.map((phase, index) => {
          const statusKey = t(`phases.${phase.key}.status`);
          const statusStyle = statusVariants[statusKey] || statusVariants.planned;
          const isLast = index === phases.length - 1;

          return (
            <div key={phase.key} className="relative flex gap-6 pb-8">
              {/* Timeline line and dot */}
              <div className="flex flex-col items-center">
                <div
                  className={`h-4 w-4 rounded-full border-2 shrink-0 z-10 ${
                    statusKey === "done"
                      ? "bg-green-500 border-green-500"
                      : statusKey === "inProgress"
                      ? "bg-amber-500 border-amber-500"
                      : "bg-surface border-border"
                  }`}
                />
                {!isLast && (
                  <div className="w-0.5 flex-1 bg-border" />
                )}
              </div>

              {/* Card */}
              <Card className="flex-1 -mt-1">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">
                        {t(`phases.${phase.key}.quarter`)}
                      </Badge>
                      <CardTitle className="text-base">
                        {t(`phases.${phase.key}.title`)}
                      </CardTitle>
                    </div>
                    <Badge
                      variant={statusStyle.variant}
                      className={statusStyle.className}
                    >
                      {t(`statuses.${statusKey}`)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {Array.from({ length: phase.featureCount }).map((_, i) => {
                      const isChecked = i < phase.completedCount;
                      return (
                        <li key={i} className="flex items-center gap-3">
                          <Checkbox
                            checked={isChecked}
                            disabled
                            className="pointer-events-none"
                          />
                          <span
                            className={`text-sm ${
                              isChecked
                                ? "text-muted-foreground line-through"
                                : "text-foreground"
                            }`}
                          >
                            {t(`phases.${phase.key}.features.${i}`)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
