"use client";

import { useTranslations } from "next-intl";

export default function AppelsOffresPage() {
  const t = useTranslations("appelsOffres");
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("title")} - coming soon</p>
    </div>
  );
}
