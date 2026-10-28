import type { ReactNode } from 'react';
import styles from './Hero.module.css';

/** One pine tree, reused along the ridge. */
const PINE = 'M0 40 L10 18 L5 18 L14 0 L23 18 L18 18 L28 40 Z';

/**
 * A night landscape drawn in SVG (sky, moon, aurora, mountains, pines), with the page heading and
 * search box on top. No game art: everything here is made of simple shapes.
 */
export function Hero({ children }: { children: ReactNode }) {
  return (
    <div className={styles.hero}>
      <svg
        className={styles.scene}
        viewBox="0 0 1200 300"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0d1a26" />
            <stop offset="0.6" stopColor="#23303a" />
            <stop offset="1" stopColor="#4a3a2c" />
          </linearGradient>
          <linearGradient id="aurora" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#4fe0a0" stopOpacity="0" />
            <stop offset="0.35" stopColor="#4fe0a0" stopOpacity="0.45" />
            <stop offset="0.7" stopColor="#8f7fe8" stopOpacity="0.35" />
            <stop offset="1" stopColor="#8f7fe8" stopOpacity="0" />
          </linearGradient>
          <pattern id="pines" width="30" height="40" patternUnits="userSpaceOnUse">
            <path d={PINE} fill="#0e1a14" />
          </pattern>
        </defs>
        <rect width="1200" height="300" fill="url(#sky)" />
        <path d="M0 90 C200 40 360 130 560 70 C760 10 900 100 1200 50 L1200 120 C900 150 760 70 560 130 C360 190 200 100 0 150 Z" fill="url(#aurora)" />
        <circle cx="930" cy="70" r="26" fill="#f1e6c4" />
        <circle cx="942" cy="64" r="24" fill="#23303a" opacity="0.55" />
        {[
          [80, 30],
          [210, 60],
          [330, 25],
          [470, 55],
          [640, 20],
          [760, 50],
          [1040, 35],
          [1130, 70],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" fill="#fff6dc" opacity="0.8" />
        ))}
        <path d="M0 220 L120 130 L200 180 L330 90 L450 190 L560 120 L700 200 L840 110 L980 190 L1100 140 L1200 200 L1200 300 L0 300 Z" fill="#2b3640" />
        <path d="M0 240 L90 190 L180 225 L300 160 L420 235 L540 185 L660 245 L800 175 L930 240 L1050 190 L1200 245 L1200 300 L0 300 Z" fill="#1d2a30" />
        <rect x="0" y="236" width="1200" height="40" fill="url(#pines)" />
        <path d="M0 262 C200 244 380 276 600 258 C820 240 1000 276 1200 256 L1200 300 L0 300 Z" fill="#101a14" />
      </svg>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
