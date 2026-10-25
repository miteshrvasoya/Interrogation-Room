import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/ui/Navbar';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://interrogation-room.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Interrogation Room — Autonomous AI Murder Mystery Arena',
    template: '%s | Interrogation Room'
  },
  description: 'A 3D courtroom where autonomous AI agents step into roles of detectives, suspects, lawyers, and judges. Watch live arguments, real-time tactical reasoning, and dramatic reveals.',
  applicationName: 'Interrogation Room',
  authors: [{ name: 'Interrogation Room AI' }],
  keywords: [
    'AI Murder Mystery',
    'Autonomous AI Agents',
    '3D Courtroom',
    'LLM Debate',
    'Interrogation Room',
    'OpenRouter AI',
    'Three.js Courtroom',
    'AI Trial Simulator'
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Interrogation Room',
    title: 'Interrogation Room — Autonomous AI Murder Mystery Arena',
    description: 'Watch autonomous AI agents argue, interrogate, and counter-argue murder mystery trials in interactive 3D. Or bring your own LLM to fight.',
    images: [
      {
        url: '/og-preview.png',
        width: 1200,
        height: 630,
        alt: 'Interrogation Room - Autonomous AI Murder Mystery 3D Arena',
        type: 'image/png'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Interrogation Room — Autonomous AI Murder Mystery Arena',
    description: 'Watch AI agents clash in 3D courtroom trials with live reasoning, forensic evidence, and dramatic reveals. Bring your own LLM or create custom cases!',
    creator: '@InterrogationAI',
    site: '@InterrogationAI',
    images: ['/og-preview.png']
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/og-preview.png'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Explicit Twitter Card metadata tags for scrapers & social crawlers */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@InterrogationAI" />
        <meta name="twitter:creator" content="@InterrogationAI" />
        <meta name="twitter:title" content="Interrogation Room — Autonomous AI Murder Mystery Arena" />
        <meta
          name="twitter:description"
          content="Watch autonomous AI agents clash in 3D courtroom trials with live reasoning, forensic clues, and dramatic reveals. Or bring your own LLM to fight!"
        />
        <meta name="twitter:image" content={`${siteUrl}/og-preview.png`} />
        <meta name="twitter:image:alt" content="Interrogation Room - Autonomous AI Murder Mystery Arena in 3D" />

        {/* Explicit OpenGraph fallback metadata tags */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Interrogation Room" />
        <meta property="og:title" content="Interrogation Room — Autonomous AI Murder Mystery Arena" />
        <meta
          property="og:description"
          content="Watch autonomous AI agents clash in 3D courtroom trials with live reasoning, forensic clues, and dramatic reveals. Or bring your own LLM to fight!"
        />
        <meta property="og:image" content={`${siteUrl}/og-preview.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={siteUrl} />
      </head>
      <body className="bg-noir-950 text-slate-100 min-h-screen relative flex flex-col antialiased selection:bg-amber-500 selection:text-noir-950">
        <GoogleAnalytics />
        {/* Subtle Noir Scanlines & Ambient Vignette */}
        <div className="fixed inset-0 noir-scanlines pointer-events-none z-30 opacity-40" />
        <div className="fixed inset-0 noir-vignette pointer-events-none z-30" />

        <Navbar />

        <main className="flex-1 flex flex-col relative z-10 pt-14">
          {children}
        </main>
      </body>
    </html>
  );
}
