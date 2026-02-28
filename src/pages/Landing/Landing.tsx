import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Network,
  Cloud,
  BookOpen,
  Download,
  Share2,
  LayoutTemplate,
} from 'lucide-react';
import styles from './Landing.module.css';

const features = [
  {
    icon: Network,
    title: 'Visual Mind Mapping',
    desc: 'Create beautiful, interactive mind maps with drag-and-drop nodes. Organize your thinking the way your brain actually works.',
  },
  {
    icon: Cloud,
    title: 'Cloud Sync',
    desc: 'Access your maps from anywhere. Free users get 1 cloud save, Pro gets unlimited cloud storage and sync.',
  },
  {
    icon: BookOpen,
    title: 'Public Library',
    desc: 'Browse, fork, and rate community mind maps. Share your knowledge with the world and learn from others.',
  },
  {
    icon: Download,
    title: 'Export Anywhere',
    desc: 'Export as PNG, SVG, PDF, or Markdown. Take your maps wherever you need them — presentations, docs, or print.',
  },
  {
    icon: Share2,
    title: 'Collaboration Ready',
    desc: 'Share maps instantly via link. Real-time collaboration with live cursors is coming soon.',
  },
  {
    icon: LayoutTemplate,
    title: 'Smart Templates',
    desc: 'Start fast with pre-built templates for study notes, project planning, brainstorming, and more.',
  },
];

declare global {
  interface Window {
    UnicornStudio?: {
      init: () => void;
      destroy: () => void;
    };
  }
}

const UNICORN_SCRIPT =
  'https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.0.5/dist/unicornStudio.umd.js';

let unicornScriptLoaded = false;

const HeroBg: React.FC = () => {
  useEffect(() => {
    let cancelled = false;

    const init = () => {
      if (cancelled) return;
      window.UnicornStudio?.destroy();
      window.UnicornStudio?.init();
    };

    if (unicornScriptLoaded && window.UnicornStudio) {
      init();
      return () => { cancelled = true; window.UnicornStudio?.destroy(); };
    }

    const script = document.createElement('script');
    script.src = UNICORN_SCRIPT;
    script.async = true;
    script.integrity = 'sha384-1lLQq1gVm4jq4xkOwlLEylCkrhtY/15eum3dwQFjauuE6ZiI5/q/UH5yY2vS24dS';
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      unicornScriptLoaded = true;
      init();
    };
    script.onerror = () => { unicornScriptLoaded = false; };
    document.head.appendChild(script);

    return () => { cancelled = true; window.UnicornStudio?.destroy(); };
  }, []);

  return (
    <div
      data-us-project="MMKZr2HlfNvoIXWacoiZ"
      className={styles.heroBg}
    />
  );
};

export const Landing: React.FC = () => {
  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>ThoughtNet</Link>
        <nav className={styles.headerLinks}>
          <Link to="/library" className={styles.headerLink}>Library</Link>
          <Link to="/login" className={styles.headerLink}>Sign in</Link>
          <Link to="/signup" className={styles.headerSignIn}>Get Started</Link>
        </nav>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <HeroBg />
        <div className={styles.heroContent}>
          <h1 className={styles.heroHeadline}>
            Map Your Mind,{' '}
            <span className={styles.heroHeadlineAccent}>Master Your Knowledge</span>
          </h1>
          <p className={styles.heroSub}>
            ThoughtNet helps you organize ideas visually with interactive mind maps.
            Free to use, powerful to master.
          </p>
          <div className={styles.heroCtas}>
            <Link to="/signup" className={styles.ctaPrimary}>Get Started Free</Link>
            <Link to="/library" className={styles.ctaSecondary}>Browse Library</Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statValue}>10-15%</div>
          <div className={styles.statLabel}>Better retention with visual learning</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>Unlimited</div>
          <div className={styles.statLabel}>Free local mind maps</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>4+</div>
          <div className={styles.statLabel}>Export formats: PNG, SVG, PDF, Markdown</div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <h2 className={styles.featuresTitle}>Everything you need to think visually</h2>
        <p className={styles.featuresSub}>
          Powerful features designed for students, creators, and teams.
        </p>
        <div className={styles.featuresGrid}>
          {features.map((f) => (
            <div key={f.title} className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <f.icon size={24} />
              </div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className={styles.bottomCta}>
        <svg
          className={styles.bottomCtaBg}
          viewBox="0 0 520 260"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <line x1="260" y1="130" x2="130" y2="60" stroke="#6366f1" strokeWidth="2" strokeOpacity="0.35" />
          <line x1="260" y1="130" x2="390" y2="60" stroke="#6366f1" strokeWidth="2" strokeOpacity="0.35" />
          <line x1="260" y1="130" x2="160" y2="210" stroke="#6366f1" strokeWidth="2" strokeOpacity="0.35" />
          <line x1="260" y1="130" x2="360" y2="210" stroke="#6366f1" strokeWidth="2" strokeOpacity="0.35" />
          <line x1="130" y1="60" x2="50" y2="40" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.2" />
          <line x1="130" y1="60" x2="80" y2="120" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.2" />
          <line x1="390" y1="60" x2="470" y2="40" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.2" />
          <line x1="390" y1="60" x2="440" y2="120" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.2" />
          <line x1="160" y1="210" x2="100" y2="240" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.2" />
          <line x1="360" y1="210" x2="420" y2="240" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.2" />
          <circle cx="50" cy="40" r="10" fill="#6366f1" fillOpacity="0.15" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.3" />
          <circle cx="80" cy="120" r="10" fill="#6366f1" fillOpacity="0.15" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.3" />
          <circle cx="470" cy="40" r="10" fill="#6366f1" fillOpacity="0.15" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.3" />
          <circle cx="440" cy="120" r="10" fill="#6366f1" fillOpacity="0.15" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.3" />
          <circle cx="100" cy="240" r="10" fill="#6366f1" fillOpacity="0.15" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.3" />
          <circle cx="420" cy="240" r="10" fill="#6366f1" fillOpacity="0.15" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.3" />
          <circle cx="130" cy="60" r="18" fill="#6366f1" fillOpacity="0.2" stroke="#6366f1" strokeWidth="2" strokeOpacity="0.5" />
          <circle cx="390" cy="60" r="18" fill="#6366f1" fillOpacity="0.2" stroke="#6366f1" strokeWidth="2" strokeOpacity="0.5" />
          <circle cx="160" cy="210" r="18" fill="#6366f1" fillOpacity="0.2" stroke="#6366f1" strokeWidth="2" strokeOpacity="0.5" />
          <circle cx="360" cy="210" r="18" fill="#6366f1" fillOpacity="0.2" stroke="#6366f1" strokeWidth="2" strokeOpacity="0.5" />
          <circle cx="260" cy="130" r="32" fill="#6366f1" fillOpacity="0.1" />
          <circle cx="260" cy="130" r="28" fill="#6366f1" fillOpacity="0.25" stroke="#6366f1" strokeWidth="2.5" strokeOpacity="0.7" />
          <circle cx="260" cy="130" r="8" fill="#6366f1" fillOpacity="0.8" />
        </svg>
        <div className={styles.bottomCtaContent}>
          <h2 className={styles.bottomCtaTitle}>Ready to start mapping?</h2>
          <p className={styles.bottomCtaSub}>
            Join the community and bring your ideas to life — completely free.
          </p>
          <Link to="/signup" className={styles.ctaPrimary}>Sign Up Free</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <span className={styles.footerBrand}>ThoughtNet</span>
        <nav className={styles.footerLinks}>
          <Link to="/library" className={styles.footerLink}>Library</Link>
          <Link to="/login" className={styles.footerLink}>Sign In</Link>
          <Link to="/signup" className={styles.footerLink}>Sign Up</Link>
        </nav>
      </footer>
    </div>
  );
};
