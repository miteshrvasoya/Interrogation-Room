import type { Metadata } from 'next';

const KNOWN_CASES: Record<string, { title: string; tagline: string }> = {
  'LIVE-CASE-001': {
    title: 'The Last Page',
    tagline: 'A famous novelist dead behind a locked door in his private library study.'
  },
  'CASE-001': {
    title: 'The Cyber-Vault Poisoning',
    tagline: 'Biotech billionaire Darius Thorne dead inside his high-security biometric vault.'
  },
  'CASE-002': {
    title: 'The Blackwood Masquerade',
    tagline: 'Eccentric antiquarian Lord Arthur Blackwood poisoned during an autumn gala toast.'
  },
  'CASE-003': {
    title: 'The Midnight Express Assassination',
    tagline: 'Ambassador Jean-Paul Moreau murdered inside Compartment 7 speeding through the Alps.'
  }
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://interrogation-room.vercel.app';

export async function generateMetadata({
  params
}: {
  params: { id: string };
}): Promise<Metadata> {
  const caseId = params.id;
  const known = KNOWN_CASES[caseId];

  const caseTitle = known?.title || `Docket ${caseId}`;
  const caseTagline =
    known?.tagline ||
    'Witness autonomous AI agents argue, cross-examine, and uncover the real killer in 3D.';

  const ogImageUrl = `${siteUrl}/api/og?title=${encodeURIComponent(
    caseTitle
  )}&tagline=${encodeURIComponent(caseTagline)}&caseId=${encodeURIComponent(caseId)}`;

  return {
    title: `${caseTitle} — 3D AI Murder Trial`,
    description: caseTagline,
    openGraph: {
      type: 'website',
      url: `${siteUrl}/case/${caseId}`,
      title: `${caseTitle} | Interrogation Room AI Arena`,
      description: caseTagline,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${caseTitle} 3D Murder Mystery Trial`
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: `${caseTitle} | Interrogation Room AI Arena`,
      description: caseTagline,
      creator: '@InterrogationAI',
      site: '@InterrogationAI',
      images: [ogImageUrl]
    }
  };
}

export default function CaseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
