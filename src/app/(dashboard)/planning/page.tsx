"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload, Calendar } from "lucide-react";

const SAMPLE_TASKS = [
  { id: 1, label: "Gros oeuvre", start: 0, duration: 4, color: "bg-accent" },
  { id: 2, label: "Charpente / Couverture", start: 3, duration: 3, color: "bg-success" },
  { id: 3, label: "Plomberie", start: 5, duration: 2, color: "bg-info" },
  { id: 4, label: "Electricite", start: 5, duration: 3, color: "bg-amber-500" },
  { id: 5, label: "Platrerie / Peinture", start: 7, duration: 3, color: "bg-violet-500" },
  { id: 6, label: "Menuiseries", start: 8, duration: 2, color: "bg-rose-500" },
  { id: 7, label: "Finitions", start: 10, duration: 2, color: "bg-teal-500" },
];

type View = "week" | "month";

export default function PlanningPage() {
  const t = useTranslations("planning");
  const tc = useTranslations("common");

  const [view, setView] = useState<View>("week");
  const [tooltip, setTooltip] = useState<string | null>(null);

  const columns = view === "week" ? 12 : 6;
  const columnLabels =
    view === "week"
      ? Array.from({ length: columns }, (_, i) => `S${i + 1}`)
      : Array.from({ length: columns }, (_, i) => `M${i + 1}`);

  // Scale tasks for month view (each unit = 2 weeks)
  const scaleFactor = view === "week" ? 1 : 0.5;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">{t("title")}</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-border overflow-hidden">
            <Button
              variant={view === "week" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setView("week")}
            >
              {t("week")}
            </Button>
            <Button
              variant={view === "month" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setView("month")}
            >
              {t("month")}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            disabled
            onMouseEnter={() => setTooltip("import")}
            onMouseLeave={() => setTooltip(null)}
          >
            <Upload className="w-4 h-4 mr-2" />
            {t("importFromContract")}
          </Button>
          {tooltip === "import" && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-foreground text-background rounded whitespace-nowrap z-10">
              {tc("comingSoon")}
            </div>
          )}
        </div>
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            disabled
            onMouseEnter={() => setTooltip("export")}
            onMouseLeave={() => setTooltip(null)}
          >
            <Download className="w-4 h-4 mr-2" />
            {t("exportPDF")}
          </Button>
          {tooltip === "export" && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-foreground text-background rounded whitespace-nowrap z-10">
              {tc("comingSoon")}
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {t("title")} - {view === "week" ? t("week") : t("month")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 overflow-x-auto">
          {/* Column headers */}
          <div className="min-w-[700px]">
            <div className="grid gap-0" style={{ gridTemplateColumns: `180px repeat(${columns}, 1fr)` }}>
              <div className="text-xs font-medium text-muted-foreground p-2 border-b border-border">
                Tache
              </div>
              {columnLabels.map((label) => (
                <div
                  key={label}
                  className="text-xs font-medium text-muted-foreground text-center p-2 border-b border-l border-border"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Task rows */}
            {SAMPLE_TASKS.map((task) => {
              const scaledStart = Math.round(task.start * scaleFactor);
              const scaledDuration = Math.max(1, Math.round(task.duration * scaleFactor));

              return (
                <div
                  key={task.id}
                  className="grid gap-0 items-center"
                  style={{ gridTemplateColumns: `180px repeat(${columns}, 1fr)` }}
                >
                  <div className="text-sm p-2 border-b border-border truncate" title={task.label}>
                    {task.label}
                  </div>
                  {Array.from({ length: columns }, (_, colIdx) => {
                    const inRange = colIdx >= scaledStart && colIdx < scaledStart + scaledDuration;
                    const isStart = colIdx === scaledStart;
                    const isEnd = colIdx === scaledStart + scaledDuration - 1;

                    return (
                      <div
                        key={colIdx}
                        className="h-10 border-b border-l border-border flex items-center p-0.5"
                      >
                        {inRange && (
                          <div
                            className={`h-7 w-full ${task.color} opacity-80 ${
                              isStart ? "rounded-l-md ml-0.5" : ""
                            } ${isEnd ? "rounded-r-md mr-0.5" : ""}`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-border">
            {SAMPLE_TASKS.map((task) => (
              <div key={task.id} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-sm ${task.color} opacity-80`} />
                <span className="text-xs text-muted-foreground">{task.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground text-center">
            {tc("comingSoon")} -- Les donnees de planning seront synchronisees avec vos affaires.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
