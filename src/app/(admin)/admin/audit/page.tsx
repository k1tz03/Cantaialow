"use client";

import { useTranslations } from "next-intl";

export default function AdminAuditPage() {
  const t = useTranslations("admin");
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">{t("audit")}</h1>
      <p className="text-muted-foreground">{t("audit")} - coming soon</p>
    </div>
  );
}
