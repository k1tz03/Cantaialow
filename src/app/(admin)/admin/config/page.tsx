"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ConfigValues {
  quotaFree: number;
  quotaPro: number;
  cacheTtlDays: number;
  maintenanceMessage: string;
}

export default function AdminConfigPage() {
  const t = useTranslations("admin");
  const [config, setConfig] = useState<ConfigValues>({
    quotaFree: 50,
    quotaPro: 500,
    cacheTtlDays: 7,
    maintenanceMessage: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = (field: keyof ConfigValues, value: string | number) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    // In a real implementation this would POST to /api/admin/config
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSaving(false);
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">{t("config")}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Platform Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Quota Free (calls/month)
              </label>
              <Input
                type="number"
                min={0}
                value={config.quotaFree}
                onChange={(e) =>
                  handleChange("quotaFree", parseInt(e.target.value, 10) || 0)
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Monthly AI call limit for FREE plan users.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Quota Pro (calls/month)
              </label>
              <Input
                type="number"
                min={0}
                value={config.quotaPro}
                onChange={(e) =>
                  handleChange("quotaPro", parseInt(e.target.value, 10) || 0)
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Monthly AI call limit for PRO plan users.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Cache TTL (days)
              </label>
              <Input
                type="number"
                min={1}
                max={90}
                value={config.cacheTtlDays}
                onChange={(e) =>
                  handleChange(
                    "cacheTtlDays",
                    parseInt(e.target.value, 10) || 7
                  )
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                How long AI response cache entries are retained.
              </p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Maintenance Message
            </label>
            <textarea
              className="w-full min-h-[100px] rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              placeholder="Leave empty for no maintenance banner..."
              value={config.maintenanceMessage}
              onChange={(e) =>
                handleChange("maintenanceMessage", e.target.value)
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              If set, a banner will display this message to all users.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Configuration"}
            </Button>
            {saved && (
              <span className="text-sm text-success font-medium">
                Configuration saved successfully.
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
