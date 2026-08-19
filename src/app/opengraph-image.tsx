import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Site-wide link-preview card (WhatsApp, iMessage, Twitter, etc.).
// Without this, apps fall back to the favicon and render it huge.
export const alt = 'Sport of Kings — Seerat Un Nabi | BJJ & Martial Arts Manchester';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
    const logoData = await readFile(join(process.cwd(), 'public', 'logo-full.png'));
    const logoSrc = `data:image/png;base64,${logoData.toString('base64')}`;

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F1E6 100%)',
                }}
            >
                {/* Crest */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '470px',
                        height: '100%',
                        flexShrink: 0,
                    }}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoSrc} width={400} height={400} alt="" />
                </div>

                {/* Wordmark */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        paddingRight: '80px',
                    }}
                >
                    <div
                        style={{
                            fontSize: '72px',
                            fontWeight: 700,
                            color: '#A88B3D',
                            lineHeight: 1.05,
                            letterSpacing: '-1px',
                        }}
                    >
                        Sport of Kings
                    </div>
                    <div
                        style={{
                            fontSize: '34px',
                            fontWeight: 700,
                            color: '#1B4332',
                            marginTop: '14px',
                        }}
                    >
                        Seerat Un Nabi
                    </div>
                    <div
                        style={{
                            width: '120px',
                            height: '5px',
                            background: '#C5A456',
                            borderRadius: '3px',
                            marginTop: '28px',
                        }}
                    />
                    <div
                        style={{
                            fontSize: '30px',
                            color: '#374151',
                            marginTop: '28px',
                            lineHeight: 1.4,
                        }}
                    >
                        Brazilian Jiu-Jitsu & Martial Arts
                    </div>
                    <div style={{ fontSize: '30px', color: '#374151', display: 'flex' }}>
                        Manchester, UK
                    </div>
                    <div
                        style={{
                            fontSize: '24px',
                            color: '#6B7280',
                            marginTop: '34px',
                        }}
                    >
                        sportofkings.info
                    </div>
                </div>
            </div>
        ),
        { ...size }
    );
}
