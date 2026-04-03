"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  Building2,
  FileText,
  Shield,
  Calculator,
  Users,
  Rocket,
  Laptop,
  ChevronDown,
  ArrowRight,
} from "lucide-react";

const STEPS = [
  { icon: Building2, key: "1" },
  { icon: FileText, key: "2" },
  { icon: Shield, key: "3" },
  { icon: Shield, key: "4" },
  { icon: Calculator, key: "5" },
  { icon: Users, key: "6" },
  { icon: Laptop, key: "7" },
] as const;

export default function GuidePage() {
  const t = useTranslations("guide");
  const [openStep, setOpenStep] = useState<string | null>(null);

  const toggle = (key: string) => {
    setOpenStep((prev) => (prev === key ? null : key));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-16">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-display font-bold">{t("title")}</h1>
        <p className="text-muted-foreground text-lg">{t("subtitle")}</p>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {STEPS.map(({ icon: Icon, key }) => {
          const isOpen = openStep === key;
          return (
            <div
              key={key}
              className="rounded-lg border border-border bg-surface shadow-sm overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggle(key)}
                className="flex w-full items-center gap-4 p-5 text-left transition-colors duration-150 ease-out hover:bg-muted/50"
              >
                {/* Step number circle */}
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-500 font-display font-bold text-sm">
                  {key}
                </span>

                {/* Icon */}
                <Icon className="h-5 w-5 shrink-0 text-amber-500" />

                {/* Title */}
                <span className="flex-1 font-semibold font-display text-base">
                  {t(`step${key}Title`)}
                </span>

                {/* Chevron */}
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-150 ease-out ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Expandable content */}
              <div
                className={`grid transition-all duration-200 ease-out ${
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="px-5 pb-5 pt-0 pl-[4.75rem] text-muted-foreground leading-relaxed text-sm whitespace-pre-line">
                    {t(`step${key}Description`)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-8 text-center space-y-4">
        <Rocket className="mx-auto h-8 w-8 text-amber-500" />
        <h2 className="text-xl font-display font-bold">{t("ctaTitle")}</h2>
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-6 py-3 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-amber-600"
        >
          {t("ctaButton")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
