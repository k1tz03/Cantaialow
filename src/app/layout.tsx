import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ConductorOS — L'assistant IA pour conducteurs de travaux",
    template: "%s | ConductorOS",
  },
  description:
    "Emails, appels d'offres, contrats, PV — tout automatisé pour les conducteurs de travaux.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "ConductorOS — L'assistant IA pour conducteurs de travaux",
    description:
      "Emails, appels d'offres, contrats, PV — tout automatisé pour les conducteurs de travaux.",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://conductoros.com",
    siteName: "ConductorOS",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ConductorOS — L'assistant IA pour conducteurs de travaux",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ConductorOS — L'assistant IA pour conducteurs de travaux",
    description:
      "Emails, appels d'offres, contrats, PV — tout automatisé pour les conducteurs de travaux.",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="font-body antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "ConductorOS",
              url: process.env.NEXT_PUBLIC_APP_URL || "https://conductoros.com",
              logo: `${process.env.NEXT_PUBLIC_APP_URL || "https://conductoros.com"}/og-image.png`,
              description:
                "L'assistant IA pour conducteurs de travaux. Emails, appels d'offres, contrats, PV — tout automatisé.",
              sameAs: [],
            }),
          }}
        />
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
