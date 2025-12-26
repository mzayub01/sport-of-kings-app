import Link from 'next/link';
import Image from 'next/image';
import {
    MapPin,
    Phone,
    Mail,
    Facebook,
    Instagram,
    Youtube
} from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="footer-grid">
                {/* Brand */}
                <div className="footer-brand">
                    <Image
                        src="/logo-simple.png"
                        alt="Sport of Kings"
                        width={120}
                        height={120}
                        style={{
                            height: '80px',
                            width: 'auto',
                            filter: 'brightness(0) invert(1)'
                        }}
                    />
                    <p style={{ marginTop: 'var(--space-4)' }}>
                        Professional martial arts instruction in a safe and friendly environment.
                        Reviving the Sunnah through sports excellence.
                    </p>
                    <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                        <a
                            href="https://facebook.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--color-gray-400)' }}
                        >
                            <Facebook size={20} />
                        </a>
                        <a
                            href="https://instagram.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--color-gray-400)' }}
                        >
                            <Instagram size={20} />
                        </a>
                        <a
                            href="https://youtube.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--color-gray-400)' }}
                        >
                            <Youtube size={20} />
                        </a>
                    </div>
                </div>

                {/* Quick Links */}
                <div>
                    <h4 className="footer-title">Quick Links</h4>
                    <ul className="footer-links">
                        <li><Link href="/about">About Us</Link></li>
                        <li><Link href="/classes">BJJ Classes</Link></li>
                        <li><Link href="/events">Events</Link></li>
                        <li><Link href="/register">Register</Link></li>
                    </ul>
                </div>

                {/* Locations */}
                <div>
                    <h4 className="footer-title">Our Locations</h4>
                    <ul className="footer-links">
                        <li><Link href="/classes">Fats Gym, Mcr City</Link></li>
                        <li><Link href="/classes">Cheadle Masjid</Link></li>
                        <li><Link href="/classes">Afifah School</Link></li>
                        <li><Link href="/classes">Guidance Hub</Link></li>
                        <li><Link href="/classes">PCC</Link></li>
                    </ul>
                </div>

                {/* Contact */}
                <div>
                    <h4 className="footer-title">Contact Us</h4>
                    <ul className="footer-links">
                        <li style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                            <MapPin size={16} style={{ marginTop: '4px', flexShrink: 0 }} />
                            <span>Manchester, UK<br />Near Piccadilly Station</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <Mail size={16} />
                            <a href="mailto:info@sportofkings.co.uk">info@sportofkings.co.uk</a>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <Phone size={16} />
                            <span>Free On-site Parking</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="footer-bottom">
                <p>© {currentYear} Sport of Kings - Seerat Un Nabi. All rights reserved.</p>
                <div style={{ marginTop: 'var(--space-2)', display: 'flex', justifyContent: 'center', gap: 'var(--space-4)' }}>
                    <Link href="/privacy">Privacy Policy</Link>
                    <Link href="/terms">Terms of Service</Link>
                    <Link href="/waiver">Liability Waiver</Link>
                </div>
            </div>
        </footer>
    );
}
