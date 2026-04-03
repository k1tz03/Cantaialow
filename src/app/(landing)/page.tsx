"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  FileText,
  ScrollText,
  Bot,
  CalendarDays,
  Truck,
  Check,
  X,
  ChevronDown,
  Zap,
  Clock,
  Globe,
  Wrench,
  Paintbrush,
  Droplets,
  Hammer,
  TreePine,
  Key,
  Layers,
  Building,
  ThermometerSun,
  Ruler,
  Shield,
} from "lucide-react";
import { useState } from "react";

const features = [
  { icon: Mail, key: "email" },
  { icon: FileText, key: "ao" },
  { icon: ScrollText, key: "contrats" },
  { icon: Bot, key: "assistant" },
  { icon: CalendarDays, key: "planning" },
  { icon: Truck, key: "fournisseurs" },
];

const trades = [
  { icon: Zap, label: "Electriciens" },
  { icon: Paintbrush, label: "Peintres" },
  { icon: Droplets, label: "Plombiers" },
  { icon: Hammer, label: "Macons" },
  { icon: TreePine, label: "Paysagistes" },
  { icon: Key, label: "Serruriers" },
  { icon: Layers, label: "Platriers" },
  { icon: Building, label: "Couvreurs" },
  { icon: Ruler, label: "Carreleurs" },
  { icon: ThermometerSun, label: "HVAC" },
  { icon: Wrench, label: "Charpentiers" },
  { icon: Shield, label: "Et tous les autres" },
];

const faqContent: Record<string, { q: string; a: string }> = {
  faq1q: { q: "Faut-il se former pour utiliser ConductorOS ?", a: "Non. L'interface est intuitive et l'IA s'adapte a votre facon de travailler. Vous etes operationnel en moins de 5 minutes." },
  faq2q: { q: "ConductorOS fonctionne pour quel metier ?", a: "Tous les corps de metier du BTP : electriciens, peintres, plombiers, macons, couvreurs, et bien d'autres. L'IA s'adapte a votre vocabulaire." },
  faq3q: { q: "Mes donnees sont-elles securisees ?", a: "Oui. Hebergement en Europe (Supabase EU), chiffrement des donnees, conformite RGPD. Vos documents ne sont jamais partages." },
  faq4q: { q: "Puis-je annuler mon abonnement a tout moment ?", a: "Oui, sans engagement. Annulez en un clic depuis votre espace, vous conservez l'acces jusqu'a la fin de la periode payee." },
  faq5q: { q: "Comment fonctionne l'analyse PDF ?", a: "Notre triple couche d'extraction gere les PDFs natifs, scannes et meme les documents de mauvaise qualite grace a l'IA vision." },
  faq6q: { q: "Combien de temps economise ConductorOS ?", a: "En moyenne 3 heures par jour. L'IA repond a vos emails, analyse vos appels d'offres et genere vos PV automatiquement." },
};

export default function LandingPage() {
  const t = useTranslations("landing");
  const tPricing = useTranslations("pricing");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [yearly, setYearly] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm">C</span>
            </div>
            <span className="font-display font-bold text-lg">ConductorOS</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">{t("ctaPrimary")}</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent" />
        <div className="max-w-5xl mx-auto px-4 py-20 md:py-32 text-center relative">
          <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight tracking-tight">
            {t("heroTitle")}
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("heroSubtitle")}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="text-base px-8">
                {t("ctaPrimary")}
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-base px-8">
              {t("ctaSecondary")}
            </Button>
          </div>

          {/* Demo preview */}
          <div className="mt-16 rounded-xl border border-border bg-surface shadow-2xl overflow-hidden max-w-4xl mx-auto">
            <div className="h-8 bg-elevated border-b border-border flex items-center gap-2 px-4">
              <div className="w-3 h-3 rounded-full bg-danger/60" />
              <div className="w-3 h-3 rounded-full bg-accent/60" />
              <div className="w-3 h-3 rounded-full bg-success/60" />
            </div>
            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-elevated border border-border">
                <Mail className="w-5 h-5 text-accent mb-2" />
                <p className="text-xs text-muted-foreground">Email IA</p>
                <p className="text-sm font-medium mt-1">Reponse generee en 3s</p>
              </div>
              <div className="p-4 rounded-lg bg-elevated border border-border">
                <FileText className="w-5 h-5 text-info mb-2" />
                <p className="text-xs text-muted-foreground">Appel d offres</p>
                <p className="text-sm font-medium mt-1">12 lots extraits</p>
              </div>
              <div className="p-4 rounded-lg bg-elevated border border-border">
                <ScrollText className="w-5 h-5 text-success mb-2" />
                <p className="text-xs text-muted-foreground">PV genere</p>
                <p className="text-sm font-medium mt-1">Pret a signer</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-20 bg-surface">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center mb-12">
            {t("problemTitle")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-danger/20">
              <CardContent className="p-6">
                <h3 className="font-bold text-danger mb-4">{t("beforeTitle")}</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><X className="w-4 h-4 text-danger shrink-0 mt-0.5" /> 2h a trier et repondre aux emails</li>
                  <li className="flex items-start gap-2"><X className="w-4 h-4 text-danger shrink-0 mt-0.5" /> 1h a lire les appels d offres</li>
                  <li className="flex items-start gap-2"><X className="w-4 h-4 text-danger shrink-0 mt-0.5" /> 45min a rediger les PV</li>
                  <li className="flex items-start gap-2"><X className="w-4 h-4 text-danger shrink-0 mt-0.5" /> Relances fournisseurs oubliees</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-success/20">
              <CardContent className="p-6">
                <h3 className="font-bold text-success mb-4">{t("afterTitle")}</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> Emails traites en 15min par l IA</li>
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> AO analyses en 3 minutes</li>
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> PV generes automatiquement</li>
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> Relances automatiques</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center mb-12">
            {t("featuresTitle")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.key} className="hover:border-accent/30 transition-colors">
                <CardContent className="p-6">
                  <f.icon className="w-8 h-8 text-accent mb-3" />
                  <h3 className="font-bold mb-1">{f.key}</h3>
                  <p className="text-sm text-muted-foreground">
                    {f.key === "email" && "Reponses IA intelligentes, classification automatique, tous les tons."}
                    {f.key === "ao" && "Extraction automatique des lots, selection, envoi aux fournisseurs."}
                    {f.key === "contrats" && "Analyse complete, alertes, obligations, chat contextuel."}
                    {f.key === "assistant" && "Chat IA avec contexte de vos projets et documents."}
                    {f.key === "planning" && "Gantt simplifie, import depuis contrats, partage client."}
                    {f.key === "fournisseurs" && "Base de donnees, historique, demandes de prix automatisees."}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trades */}
      <section className="py-20 bg-surface">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-display font-bold mb-4">
            {t("tradesTitle")}
          </h2>
          <p className="text-muted-foreground mb-12">{t("tradesSubtitle")}</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {trades.map((trade) => (
              <div key={trade.label} className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-elevated transition-colors">
                <trade.icon className="w-6 h-6 text-accent" />
                <span className="text-xs text-muted-foreground">{trade.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center mb-12">
            {t("statsTitle")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-4xl font-display font-bold text-accent">30M+</p>
              <p className="text-sm text-muted-foreground mt-2">Entreprises de trades dans le monde</p>
            </div>
            <div>
              <p className="text-4xl font-display font-bold text-accent flex items-center justify-center gap-1"><Clock className="w-8 h-8" /> 3h</p>
              <p className="text-sm text-muted-foreground mt-2">Economisees en moyenne par jour</p>
            </div>
            <div>
              <p className="text-4xl font-display font-bold text-accent flex items-center justify-center gap-1"><Globe className="w-8 h-8" /> 4</p>
              <p className="text-sm text-muted-foreground mt-2">Langues disponibles</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-surface" id="pricing">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center mb-4">
            {tPricing("title")}
          </h2>
          <div className="flex justify-center mb-12">
            <div className="flex items-center gap-3 p-1 rounded-lg bg-elevated">
              <button
                onClick={() => setYearly(false)}
                className={`px-4 py-2 rounded-md text-sm ${!yearly ? "bg-accent text-white" : "text-muted-foreground"}`}
              >
                {tPricing("monthly")}
              </button>
              <button
                onClick={() => setYearly(true)}
                className={`px-4 py-2 rounded-md text-sm ${yearly ? "bg-accent text-white" : "text-muted-foreground"}`}
              >
                {tPricing("yearly")} <Badge variant="success" className="ml-1 text-[10px]">-20%</Badge>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-display font-bold text-xl">{tPricing("free")}</h3>
                <p className="text-3xl font-bold mt-2">0 EUR</p>
                <ul className="mt-6 space-y-2 text-sm">
                  <li className="flex gap-2"><Check className="w-4 h-4 text-success shrink-0" />{tPricing("features.aiCalls20")}</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-success shrink-0" />{tPricing("features.haikuOnly")}</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-success shrink-0" />{tPricing("features.emailIntegration")}</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-success shrink-0" />{tPricing("features.pdfAnalysis")}</li>
                </ul>
                <Link href="/register" className="block mt-6">
                  <Button variant="outline" className="w-full">{tPricing("startFree")}</Button>
                </Link>
              </CardContent>
            </Card>
            {/* Pro */}
            <Card className="border-accent relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge>Popular</Badge>
              </div>
              <CardContent className="p-6">
                <h3 className="font-display font-bold text-xl">{tPricing("pro")}</h3>
                <p className="text-3xl font-bold mt-2">
                  {yearly ? "24" : "30"} EUR<span className="text-sm font-normal text-muted-foreground">{yearly ? tPricing("perMonth") : tPricing("perMonth")}</span>
                </p>
                {yearly && <p className="text-xs text-success">288 EUR{tPricing("perYear")}</p>}
                <ul className="mt-6 space-y-2 text-sm">
                  <li className="flex gap-2"><Check className="w-4 h-4 text-success shrink-0" />{tPricing("features.aiCalls300")}</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-success shrink-0" />{tPricing("features.allModels")}</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-success shrink-0" />{tPricing("features.emailIntegration")}</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-success shrink-0" />{tPricing("features.pdfAnalysis")}</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-success shrink-0" />{tPricing("features.prioritySupport")}</li>
                </ul>
                <Link href="/register" className="block mt-6">
                  <Button className="w-full">{tPricing("subscribe")}</Button>
                </Link>
              </CardContent>
            </Card>
            {/* Business */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-display font-bold text-xl">{tPricing("business")}</h3>
                <p className="text-3xl font-bold mt-2 text-muted-foreground">---</p>
                <ul className="mt-6 space-y-2 text-sm">
                  <li className="flex gap-2"><Check className="w-4 h-4 text-success shrink-0" />{tPricing("features.aiCallsUnlimited")}</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-success shrink-0" />{tPricing("features.allModels")}</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-success shrink-0" />{tPricing("features.teamMembers")}</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-success shrink-0" />{tPricing("features.apiAccess")}</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-success shrink-0" />{tPricing("features.customPrompts")}</li>
                </ul>
                <Button variant="outline" className="w-full mt-6" disabled>
                  {tPricing("contactUs")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center mb-12">
            {t("faqTitle")}
          </h2>
          <div className="space-y-2">
            {Object.entries(faqContent).map(([key, item], idx) => (
              <div key={key} className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left text-sm font-medium hover:bg-elevated transition-colors"
                >
                  {item.q}
                  <ChevronDown className={`w-4 h-4 transition-transform ${openFaq === idx ? "rotate-180" : ""}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 text-sm text-muted-foreground">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-surface">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-display font-bold mb-6">
            {t("ctaFinalTitle")}
          </h2>
          <Link href="/register">
            <Button size="lg" className="text-base px-8">
              {t("ctaFinalButton")}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-accent flex items-center justify-center">
              <span className="text-white font-display font-bold text-xs">C</span>
            </div>
            <span>ConductorOS &copy; 2026</span>
          </div>
          <div className="flex gap-6">
            <Link href="/legal/mentions" className="hover:text-foreground">Mentions legales</Link>
            <Link href="/legal/cgu" className="hover:text-foreground">CGU</Link>
            <Link href="/legal/confidentialite" className="hover:text-foreground">Confidentialite</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
