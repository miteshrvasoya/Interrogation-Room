import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const title =
      searchParams.get('title') || 'Interrogation Room — Autonomous AI Murder Mystery Arena';
    const tagline =
      searchParams.get('tagline') ||
      'Watch autonomous AI agents argue, interrogate, and counter-argue murder mystery trials in interactive 3D.';
    const caseId = searchParams.get('caseId') || 'LIVE TRIAL';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#05070d',
            backgroundImage:
              'radial-gradient(circle at 50% 20%, rgba(245, 158, 11, 0.15), transparent 60%), radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.15), transparent 50%)',
            padding: '60px 70px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#f8fafc',
            border: '8px solid #1e293b',
          }}
        >
          {/* Top Brand & Badge Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(245, 158, 11, 0.2)',
                  border: '2px solid #f59e0b',
                  fontSize: '26px',
                }}
              >
                ⚖️
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontSize: '24px',
                    fontWeight: 900,
                    letterSpacing: '2px',
                    color: '#fbbf24',
                    textTransform: 'uppercase',
                  }}
                >
                  INTERROGATION ROOM
                </span>
                <span style={{ fontSize: '13px', color: '#94a3b8', letterSpacing: '1px' }}>
                  AUTONOMOUS AI MURDER MYSTERY ARENA
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                border: '1.5px solid rgba(239, 68, 68, 0.6)',
                padding: '8px 18px',
                borderRadius: '999px',
              }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                }}
              />
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 800,
                  color: '#fca5a5',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                }}
              >
                {caseId}
              </span>
            </div>
          </div>

          {/* Center Case Title & Premise */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', margin: '20px 0' }}>
            <div
              style={{
                fontSize: title.length > 40 ? '48px' : '58px',
                fontWeight: 900,
                lineHeight: 1.15,
                color: '#ffffff',
                textShadow: '0 4px 20px rgba(0, 0, 0, 0.8)',
                letterSpacing: '-0.5px',
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: '22px',
                lineHeight: 1.45,
                color: '#cbd5e1',
                maxWidth: '980px',
              }}
            >
              {tagline}
            </div>
          </div>

          {/* Bottom Capabilities & URL Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid rgba(148, 163, 184, 0.2)',
              paddingTop: '24px',
            }}
          >
            <div style={{ display: 'flex', gap: '12px' }}>
              <div
                style={{
                  padding: '6px 14px',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#fbbf24',
                }}
              >
                3D COURTROOM
              </div>
              <div
                style={{
                  padding: '6px 14px',
                  backgroundColor: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#a5b4fc',
                }}
              >
                DUAL-LAYER REASONING
              </div>
              <div
                style={{
                  padding: '6px 14px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#6ee7b7',
                }}
              >
                AUTONOMOUS CLASH
              </div>
            </div>

            <div
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: '#94a3b8',
                letterSpacing: '0.5px',
              }}
            >
              interrogation-room.vercel.app
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate social preview image: ${e.message}`, {
      status: 500,
    });
  }
}
