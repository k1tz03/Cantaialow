"use client";

import { useTranslations } from "next-intl";

export default function GuidePage() {
  const t = useTranslations("nav");
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">{t("guide")}</h1>
      <p className="text-muted-foreground">{t("guide")} - coming soon</p>
    </div>
  );
}
