"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Building2,
  Shield,
  CreditCard,
  Plug,
  Bell,
  AlertTriangle,
  Save,
  Check,
  ExternalLink,
} from "lucide-react";

type Tab = "profile" | "company" | "security" | "billing" | "integrations" | "notifications" | "danger";

const tabs = [
  { id: "profile" as Tab, icon: User },
  { id: "company" as Tab, icon: Building2 },
  { id: "security" as Tab, icon: Shield },
  { id: "billing" as Tab, icon: CreditCard },
  { id: "integrations" as Tab, icon: Plug },
  { id: "notifications" as Tab, icon: Bell },
  { id: "dangerZone" as Tab, icon: AlertTriangle },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const t = useTranslations("settings");
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Profile state
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("FR");
  const [metier, setMetier] = useState("");

  // Company state
  const [orgName, setOrgName] = useState("");
  const [siret, setSiret] = useState("");
  const [adresse, setAdresse] = useState("");
  const [billingEmail, setBillingEmail] = useState("");

  // Security state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/settings/profile");
        if (res.ok) {
          const data = await res.json();
          setName(data.user?.name ?? "");
          setLanguage(data.user?.language ?? "FR");
          setMetier(data.user?.metier ?? "");
          setOrgName(data.organization?.name ?? "");
          setSiret(data.organization?.siret ?? "");
          setAdresse(data.organization?.adresse ?? "");
          setBillingEmail(data.organization?.emailFacturation ?? "");
        }
      } catch {
        // ignore
      }
    }
    loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, language, theme, metier, orgName, siret, adresse, emailFacturation: billingEmail }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        setCurrentPassword("");
        setNewPassword("");
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const handleCheckout = async (yearly: boolean) => {
    const priceId = yearly ? process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY : process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY;
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId: priceId ?? "price_pro_monthly" }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  const handlePortal = async () => {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">{t("title")}</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tab nav */}
        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible lg:w-48 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "bg-accent/10 text-accent font-medium"
                  : "text-muted-foreground hover:bg-elevated"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {t(tab.id)}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 max-w-2xl">
          {activeTab === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("profile")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">{t("firstName")}</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">{t("language")}</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="mt-1 w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                  >
                    <option value="FR">Francais</option>
                    <option value="EN">English</option>
                    <option value="ES">Espanol</option>
                    <option value="PT">Portugues</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">{t("theme")}</label>
                  <div className="flex gap-2 mt-1">
                    {(["dark", "light", "system"] as const).map((th) => (
                      <Button
                        key={th}
                        variant={theme === th ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme(th)}
                      >
                        {t(th)}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">{t("trade")}</label>
                  <Input value={metier} onChange={(e) => setMetier(e.target.value)} className="mt-1" />
                </div>
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saved ? <><Check className="w-4 h-4 mr-1" /> {t("profile")}</> : <><Save className="w-4 h-4 mr-1" /> {saving ? "..." : "Save"}</>}
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === "company" && (
            <Card>
              <CardHeader><CardTitle className="text-lg">{t("company")}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">{t("companyName")}</label>
                  <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">{t("siret")}</label>
                  <Input value={siret} onChange={(e) => setSiret(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">{t("address")}</label>
                  <Input value={adresse} onChange={(e) => setAdresse(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">{t("billingEmail")}</label>
                  <Input value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} className="mt-1" />
                </div>
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saved ? <Check className="w-4 h-4 mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                  {saving ? "..." : "Save"}
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === "security" && (
            <Card>
              <CardHeader><CardTitle className="text-lg">{t("security")}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <h3 className="font-medium">{t("changePassword")}</h3>
                <Input type="password" placeholder={t("currentPassword")} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                <Input type="password" placeholder={t("newPassword")} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} />
                <Button onClick={handleChangePassword} disabled={saving || !newPassword}>
                  {saving ? "..." : t("changePassword")}
                </Button>
                <Separator className="my-4" />
                <h3 className="font-medium">{t("twoFactor")}</h3>
                <Button variant="outline" disabled>
                  {t("twoFactor")} — Coming soon
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === "billing" && (
            <Card>
              <CardHeader><CardTitle className="text-lg">{t("billing")}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{t("currentPlan")}:</span>
                  <Badge>{session?.user?.plan ?? "FREE"}</Badge>
                </div>
                {session?.user?.plan === "FREE" ? (
                  <div className="p-4 rounded-lg border border-accent/30 bg-accent/5 space-y-3">
                    <p className="text-sm font-medium">Upgrade to Pro - 30 EUR/month</p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleCheckout(false)}>Monthly - 30 EUR</Button>
                      <Button size="sm" variant="outline" onClick={() => handleCheckout(true)}>Yearly - 288 EUR (save 20%)</Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" onClick={handlePortal}>
                    <ExternalLink className="w-4 h-4 mr-1" />
                    {t("manage")}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "integrations" && (
            <Card>
              <CardHeader><CardTitle className="text-lg">{t("integrations")}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-red-500/10 flex items-center justify-center text-red-500 text-sm font-bold">G</div>
                    <span className="text-sm font-medium">Gmail</span>
                  </div>
                  {session?.user?.orgId ? (
                    <Badge variant="success"><Check className="w-3 h-3 mr-1" />{t("connected")}</Badge>
                  ) : (
                    <Button size="sm" variant="outline">{t("connectGmail")}</Button>
                  )}
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center text-blue-500 text-sm font-bold">O</div>
                    <span className="text-sm font-medium">Outlook</span>
                  </div>
                  <Button size="sm" variant="outline">{t("connectOutlook")}</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card>
              <CardHeader><CardTitle className="text-lg">{t("notifications")}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {["aiSuggestion", "contractDeadline", "supplierNoResponse", "weeklyDigest"].map((key) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm">{key}</span>
                    <button className="w-10 h-6 rounded-full bg-accent relative">
                      <div className="w-4 h-4 rounded-full bg-white absolute right-1 top-1" />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeTab === ("dangerZone" as Tab) && (
            <Card className="border-danger/30">
              <CardHeader><CardTitle className="text-lg text-danger">{t("dangerZone")}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{t("deleteWarning")}</p>
                <Button variant="destructive">{t("deleteAccount")}</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
