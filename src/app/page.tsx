import Link from 'next/link';
import Image from 'next/image';
import {
  Award,
  Users,
  Calendar,
  Shield,
  Heart,
  Target,
  ChevronRight,
  Star,
  MapPin,
  Clock,
  Swords
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const features = [
    {
      icon: Shield,
      title: 'Prophetic Traditions',
      description: 'Reviving the Sunnah of wrestling and physical strength as encouraged by our beloved Prophet ﷺ.',
    },
    {
      icon: Users,
      title: 'Brotherhood & Sisterhood',
      description: 'A supportive community focused on character, discipline, humility, and Islamic values.',
    },
    {
      icon: Award,
      title: 'Technical Excellence',
      description: 'Experienced instructors who uphold both technical skill and good adab in every session.',
    },
    {
      icon: Target,
      title: 'Clear Pathways',
      description: 'Structured progression from beginner to advanced, with belt gradings and leadership opportunities.',
    },
    {
      icon: Heart,
      title: 'Beyond Sport',
      description: 'Training as a means of developing character, discipline, and resilience that extends beyond the mats.',
    },
    {
      icon: Calendar,
      title: 'Community Events',
      description: 'Seminars, retreats, and gatherings that create spaces for learning, reflection, and connection.',
    },
  ];

  const programs = [
    {
      title: 'Kids BJJ',
      description: 'Building confidence, discipline, and coordination in a safe, age-appropriate environment.',
      icon: Users,
      color: 'var(--color-green)',
    },
    {
      title: 'Youth BJJ',
      description: 'Empowering young people with resilience, self-defence skills, and positive mentorship.',
      icon: Star,
      color: 'var(--color-gold)',
    },
    {
      title: 'Adult BJJ',
      description: 'High-quality training for all experience levels, combining technical excellence with character development.',
      icon: Award,
      color: 'var(--color-gold)',
    },
  ];

  return (
    <>
      <Navbar user={user ? { id: user.id, email: user.email! } : null} />

      <main>
        {/* Hero Section */}
        <section className="hero" style={{ minHeight: '90vh', display: 'flex', alignItems: 'center' }}>
          <div className="hero-content animate-slide-up">
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <Image
                src="/logo-full.png"
                alt="Sport of Kings"
                width={200}
                height={200}
                priority
                style={{
                  height: '150px',
                  width: 'auto',
                  margin: '0 auto',
                }}
              />
            </div>
            <h1 className="hero-title">
              Strength with Purpose<br />Faith with Discipline
            </h1>
            <p className="hero-subtitle">
              A community-led movement reviving the Sunnah of wrestling through Brazilian Jiu-Jitsu.
              Building strong individuals, resilient families, and confident communities.
            </p>
            <div className="hero-actions">
              <Link href="/register" className="btn btn-primary btn-lg">
                <Star size={20} />
                Join Now
              </Link>
              <Link href="/about" className="btn btn-outline btn-lg">
                Our Story
                <ChevronRight size={20} />
              </Link>
            </div>
            <div
              style={{
                marginTop: 'var(--space-8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-6)',
                flexWrap: 'wrap',
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-sm)',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <MapPin size={16} />
                5 Locations in Manchester
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Users size={16} />
                All Ages Welcome
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Swords size={16} />
                Brazilian Jiu-Jitsu
              </span>
            </div>
          </div>
        </section>

        {/* Mission Statement */}
        <section
          className="section"
          style={{
            background: 'var(--color-dark-green)',
            color: 'var(--color-white)',
          }}
        >
          <div className="container" style={{ maxWidth: '900px' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{
                color: 'var(--color-gold)',
                marginBottom: 'var(--space-6)',
              }}>
                More Than Just Training
              </h2>
              <p style={{
                fontSize: 'var(--text-xl)',
                color: 'var(--color-gray-300)',
                lineHeight: '1.8',
                marginBottom: 'var(--space-6)',
              }}>
                We see training as a means of developing <strong style={{ color: 'var(--color-gold)' }}>character</strong>, <strong style={{ color: 'var(--color-gold)' }}>discipline</strong>, <strong style={{ color: 'var(--color-gold)' }}>humility</strong>, and <strong style={{ color: 'var(--color-gold)' }}>brotherhood</strong> — rooted in Islamic values and lived practice.
              </p>
              <p style={{
                fontSize: 'var(--text-lg)',
                color: 'var(--color-gray-400)',
                lineHeight: '1.8',
                marginBottom: 0,
              }}>
                Sport of Kings is not about trophies or titles. It is about showing up consistently, training with intention, and carrying the lessons of the mat into everyday life.
              </p>
            </div>
          </div>
        </section>

        {/* Fajr40 Challenge Banner */}
        <section
          style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            padding: 'var(--space-10) var(--space-6)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative stars */}
          <div style={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            width: '8px',
            height: '8px',
            background: 'var(--color-gold)',
            borderRadius: '50%',
            boxShadow: '0 0 20px var(--color-gold)',
            opacity: 0.6,
          }} />
          <div style={{
            position: 'absolute',
            top: '60%',
            right: '15%',
            width: '6px',
            height: '6px',
            background: 'var(--color-gold)',
            borderRadius: '50%',
            boxShadow: '0 0 15px var(--color-gold)',
            opacity: 0.5,
          }} />
          <div style={{
            position: 'absolute',
            bottom: '30%',
            left: '20%',
            width: '4px',
            height: '4px',
            background: '#fff',
            borderRadius: '50%',
            boxShadow: '0 0 10px #fff',
            opacity: 0.4,
          }} />

          <div className="container" style={{ maxWidth: '900px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'inline-block',
              background: 'rgba(197, 164, 86, 0.2)',
              padding: 'var(--space-1) var(--space-4)',
              borderRadius: 'var(--radius-full)',
              marginBottom: 'var(--space-4)',
            }}>
              <span style={{ color: 'var(--color-gold)', fontSize: 'var(--text-xs)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                ⭐ Sport of Kings Initiative
              </span>
            </div>

            <h2 style={{
              color: 'var(--color-white)',
              fontSize: 'var(--text-3xl)',
              marginBottom: 'var(--space-4)',
            }}>
              Join the <span style={{ color: 'var(--color-gold)' }}>Fajr40 Challenge</span>
            </h2>

            <p style={{
              color: 'var(--color-gray-300)',
              fontSize: 'var(--text-lg)',
              maxWidth: '600px',
              margin: '0 auto var(--space-6)',
              lineHeight: '1.7',
            }}>
              40 days of Fajr in congregation. A spiritual challenge to build consistency, discipline, and connection with Allah ﷻ — brought to you by Sport of Kings.
            </p>

            <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href="https://fajr40challenge.com"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-lg"
                style={{
                  background: 'linear-gradient(135deg, #D4B86A 0%, #C5A456 50%, #A88B3D 100%)',
                  color: 'var(--color-black)',
                }}
              >
                <Clock size={20} />
                Take the Challenge
              </a>
              <a
                href="https://fajr40challenge.com"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-lg"
                style={{
                  borderColor: 'var(--color-gold)',
                  color: 'var(--color-gold)',
                }}
              >
                Learn More
                <ChevronRight size={20} />
              </a>
            </div>

            <p style={{
              color: 'var(--color-gray-500)',
              fontSize: 'var(--text-sm)',
              marginTop: 'var(--space-6)',
              marginBottom: 0,
            }}>
              Sport of Kings is more than BJJ — we&apos;re building strong Muslims on and off the mats.
            </p>
          </div>
        </section>

        {/* Programs Section */}
        <section className="section" style={{ background: 'var(--bg-primary)' }}>
          <div className="container">
            <div className="section-title">
              <h2>Our Programs</h2>
              <p>
                Structured, high-quality training for children, youth, and adults,
                delivered by experienced instructors who uphold both technical excellence and good adab.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 'var(--space-6)',
              }}
            >
              {programs.map((program, index) => (
                <div
                  key={program.title}
                  className="glass-card animate-slide-up"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    borderTop: `4px solid ${program.color}`,
                  }}
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: 'var(--radius-lg)',
                      background: program.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 'var(--space-4)',
                    }}
                  >
                    <program.icon size={28} color="var(--color-black)" />
                  </div>
                  <h3 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>
                    {program.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>
                    {program.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="section">
          <div className="container">
            <div className="section-title">
              <h2>Sport of Kings is Committed To</h2>
              <p>
                Using sport as a vehicle for positive change within the Ummah.
              </p>
            </div>

            <div className="feature-grid">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="feature-card glass-card animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="feature-icon">
                    <feature.icon size={28} />
                  </div>
                  <h4 className="feature-title">{feature.title}</h4>
                  <p className="feature-description">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Locations Section */}
        <section className="section" style={{ background: 'var(--bg-secondary)' }}>
          <div className="container">
            <div className="section-title">
              <h2>5 Locations Across Manchester</h2>
              <p>
                Find a training location near you. Classes for kids, teens, and adults.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--space-4)',
                marginBottom: 'var(--space-8)',
              }}
            >
              {[
                { name: 'Fats Gym', gender: 'Male & Female', color: 'var(--color-gold)' },
                { name: 'Cheadle Masjid', gender: 'Male & Female', color: 'var(--color-gold)' },
                { name: 'Guidance Hub', gender: 'Male Only', color: 'var(--color-green)' },
                { name: 'Afifah School', gender: 'Male Only', color: 'var(--color-green)' },
                { name: 'PCC', gender: 'Male Only', color: 'var(--color-green)' },
              ].map((location, index) => (
                <div
                  key={location.name}
                  className="glass-card animate-slide-up"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    padding: 'var(--space-4)',
                    textAlign: 'center',
                    borderTop: `3px solid ${location.color}`,
                  }}
                >
                  <MapPin size={24} color={location.color} style={{ marginBottom: 'var(--space-2)' }} />
                  <h4 style={{ margin: '0 0 var(--space-1)', fontSize: 'var(--text-base)' }}>
                    {location.name}
                  </h4>
                  <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    {location.gender}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center' }}>
              <Link href="/classes" className="btn btn-outline btn-lg">
                View All Classes
                <ChevronRight size={20} />
              </Link>
            </div>
          </div>
        </section>

        {/* Quote Section */}
        <section className="section" style={{ background: 'var(--bg-primary)' }}>
          <div className="container container-md" style={{ textAlign: 'center' }}>
            <div style={{
              padding: 'var(--space-10)',
              background: 'rgba(197, 164, 86, 0.1)',
              borderRadius: 'var(--radius-xl)',
              borderLeft: '4px solid var(--color-gold)',
            }}>
              <p style={{
                fontSize: 'var(--text-2xl)',
                fontWeight: '600',
                marginBottom: 0,
                lineHeight: '1.6',
                background: 'var(--color-gold-gradient)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                &ldquo;Strength with purpose. Discipline with faith. Community with direction.&rdquo;
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section" style={{ background: 'var(--bg-primary)' }}>
          <div className="container container-md" style={{ textAlign: 'center' }}>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>
              Ready to Begin Your Journey?
            </h2>
            <p style={{
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-8)',
              fontSize: 'var(--text-lg)',
            }}>
              Whether you&apos;re a complete beginner or an experienced martial artist,
              Sport of Kings welcomes you. Join us across 5 locations in Manchester.
            </p>
            <div style={{
              display: 'flex',
              gap: 'var(--space-4)',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              <Link href="/register" className="btn btn-primary btn-lg">
                <Star size={20} />
                Register Now
              </Link>
              <Link href="/classes" className="btn btn-secondary btn-lg">
                <Calendar size={20} />
                View Classes
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
