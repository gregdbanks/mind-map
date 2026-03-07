import React, { useEffect, useRef, useState } from 'react';
import styles from './AdBanner.module.css';

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

const ADSENSE_CLIENT = 'ca-pub-4484824519626422';
const ADSENSE_SLOT = '7224933919';

interface AdBannerProps {
  isPro: boolean;
  onUpgradeClick?: () => void;
}

/** Load the AdSense script once globally */
let scriptLoaded = false;
function loadAdSenseScript(clientId: string): Promise<void> {
  if (scriptLoaded) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src*="adsbygoogle"]') as HTMLScriptElement | null;
    if (existing) {
      if (window.adsbygoogle !== undefined) {
        scriptLoaded = true;
        resolve();
      } else {
        existing.addEventListener('load', () => { scriptLoaded = true; resolve(); });
        existing.addEventListener('error', () => reject(new Error('AdSense script failed to load')));
      }
      return;
    }

    const script = document.createElement('script');
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => { scriptLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('AdSense script failed to load'));
    document.head.appendChild(script);
  });
}

export const AdBanner: React.FC<AdBannerProps> = ({ isPro, onUpgradeClick }) => {
  const [failed, setFailed] = useState(false);
  const pushed = useRef(false);

  useEffect(() => {
    if (isPro || !ADSENSE_CLIENT || !ADSENSE_SLOT) return;

    let cancelled = false;
    pushed.current = false;

    loadAdSenseScript(ADSENSE_CLIENT)
      .then(() => {
        if (cancelled || pushed.current) return;
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          pushed.current = true;
        } catch {
          setFailed(true);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      pushed.current = false;
    };
  }, [isPro]);

  // Pro users see nothing
  if (isPro) return null;

  // No credentials configured or script failed — show fallback
  if (!ADSENSE_CLIENT || !ADSENSE_SLOT || failed) {
    return (
      <aside className={styles.container} role="complementary" aria-label="Advertisement">
        <div className={styles.fallback}>
          <span className={styles.fallbackText}>
            Upgrade to Pro for an ad-free experience
          </span>
          {onUpgradeClick && (
            <button className={styles.fallbackButton} onClick={onUpgradeClick} type="button">
              Upgrade
            </button>
          )}
        </div>
      </aside>
    );
  }

  return (
    <aside className={styles.container} role="complementary" aria-label="Advertisement">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
};
