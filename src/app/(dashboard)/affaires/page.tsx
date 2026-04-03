"use client";

import { useTranslations } from "next-intl";

export default function AffairesPage() {
  const t = useTranslations("affaires");
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("title")} - coming soon</p>
    </div>
  );
}
