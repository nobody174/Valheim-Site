import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { MapPin } from './mapData';
import { direction, formatDistance, metresBetween, type Spot } from './nearby';
import { METRES_PER_PIXEL } from './terrain';
import styles from './World.module.css';

export interface MapPortal {
  id: string;
  name: string;
  x: number;
  z: number;
  down: boolean;
}

export interface MapLayer {
  id: string;
  colour: string;
  spots: Spot[];
}

interface View {
  /** World position at the middle of the map, in metres. */
  x: number;
  z: number;
  /** Metres per screen pixel. */
  mpp: number;
}

const SIZE = 900;
const FULL = 21000 / SIZE;
const CLOSEST = 1.5;
const LABEL_BELOW = 14;
const PORTAL_COLOUR = '#b48cf2';
const CLICK_SLOP = 5;
const PIN_COLOUR: Record<number, string> = {
  9: '#d3a73b',
  4: '#e0742a',
  5: '#8fb35a',
  6: '#a68fcf',
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * The world as a picture you can drag and zoom: the game's own terrain when it was given, the places ticked
 * in the list, the character's pins, and where you are. North is up.
 */
export function WorldMapView({
  image,
  layers,
  pins,
  portals,
  placing,
  onPlace,
  reference,
  focus,
}: {
  image: HTMLCanvasElement | null;
  layers: MapLayer[];
  pins: MapPin[];
  portals: MapPortal[];
  /** When set, the next click on the map reports a position instead of moving the map. */
  placing: boolean;
  onPlace: (spot: Spot) => void;
  reference: Spot | null;
  /** A spot to show: the map opens on it, with a ring and the way from the reference. */
  focus: Spot | null;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [view, setView] = useState<View>(() => {
    if (focus && reference) {
      const reach = Math.max(Math.abs(focus.x - reference.x), Math.abs(focus.z - reference.z));
      return {
        x: (focus.x + reference.x) / 2,
        z: (focus.z + reference.z) / 2,
        mpp: clamp((reach * 1.6) / SIZE, CLOSEST, FULL),
      };
    }
    if (focus) return { x: focus.x, z: focus.z, mpp: 10 };
    return reference ? { x: reference.x, z: reference.z, mpp: 6 } : { x: 0, z: 0, mpp: FULL };
  });
  const [cursor, setCursor] = useState<Spot | null>(null);
  const drag = useRef<{ id: number; u: number; v: number; u0: number; v0: number } | null>(null);

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    const u = (x: number) => (x - view.x) / view.mpp + SIZE / 2;
    const v = (z: number) => SIZE / 2 - (z - view.z) / view.mpp;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0e0b08';
    ctx.fillRect(0, 0, SIZE, SIZE);
    if (image) {
      const k = METRES_PER_PIXEL / view.mpp;
      ctx.imageSmoothingEnabled = true;
      ctx.setTransform(k, 0, 0, k, u(-1024 * METRES_PER_PIXEL), v(1023 * METRES_PER_PIXEL));
      ctx.drawImage(image, 0, 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    } else {
      ctx.strokeStyle = '#6b4f33';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(u(0), v(0), 10000 / view.mpp, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(0,0,0,0.75)';
    for (const layer of layers) {
      ctx.fillStyle = layer.colour;
      for (const s of layer.spots) {
        const sx = u(s.x);
        const sy = v(s.z);
        if (sx < -6 || sy < -6 || sx > SIZE + 6 || sy > SIZE + 6) continue;
        ctx.beginPath();
        ctx.arc(sx, sy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    ctx.font = '600 13px Inter, system-ui, sans-serif';
    ctx.lineJoin = 'round';
    for (const p of pins) {
      const sx = u(p.x);
      const sy = v(p.z);
      if (sx < -6 || sy < -6 || sx > SIZE + 6 || sy > SIZE + 6) continue;
      ctx.fillStyle = PIN_COLOUR[p.type] ?? '#efe8d8';
      ctx.beginPath();
      ctx.moveTo(sx, sy - 7);
      ctx.lineTo(sx + 6, sy);
      ctx.lineTo(sx, sy + 7);
      ctx.lineTo(sx - 6, sy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      const label = p.name.startsWith('$') ? '' : p.name;
      if (label && view.mpp < LABEL_BELOW) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.strokeText(label, sx + 9, sy + 4);
        ctx.fillStyle = '#efe8d8';
        ctx.fillText(label, sx + 9, sy + 4);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(0,0,0,0.75)';
      }
    }

    for (const portal of portals) {
      const sx = u(portal.x);
      const sy = v(portal.z);
      if (sx < -12 || sy < -12 || sx > SIZE + 12 || sy > SIZE + 12) continue;
      ctx.globalAlpha = portal.down ? 0.5 : 1;
      ctx.strokeStyle = PORTAL_COLOUR;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sx, sy, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = PORTAL_COLOUR;
      ctx.beginPath();
      ctx.arc(sx, sy, 3, 0, Math.PI * 2);
      ctx.fill();
      if (view.mpp < LABEL_BELOW * 2) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.strokeText(portal.name, sx + 12, sy + 4);
        ctx.fillStyle = '#e4d3ff';
        ctx.fillText(portal.name, sx + 12, sy + 4);
      }
      ctx.globalAlpha = 1;
    }

    if (focus) {
      const fx = u(focus.x);
      const fy = v(focus.z);
      if (reference) {
        ctx.setLineDash([8, 6]);
        ctx.strokeStyle = '#ffe28a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(u(reference.x), v(reference.z));
        ctx.lineTo(fx, fy);
        ctx.stroke();
        ctx.setLineDash([]);
        const text = `${formatDistance(metresBetween(reference, focus))} ${direction(reference, focus)}`;
        const mx = (u(reference.x) + fx) / 2;
        const my = (v(reference.z) + fy) / 2;
        ctx.font = '700 15px Inter, system-ui, sans-serif';
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(0,0,0,0.9)';
        ctx.strokeText(text, mx + 8, my - 8);
        ctx.fillStyle = '#ffe28a';
        ctx.fillText(text, mx + 8, my - 8);
      }
      ctx.strokeStyle = '#ffe28a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(fx, fy, 14, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (reference) {
      const sx = u(reference.x);
      const sy = v(reference.z);
      ctx.strokeStyle = '#efe8d8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(sx, sy, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#efe8d8';
      ctx.beginPath();
      ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [image, layers, pins, portals, reference, focus, view]);

  // The wheel needs a non-passive listener to stop the page from scrolling while the map zooms.
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * SIZE;
      const py = ((e.clientY - rect.top) / rect.height) * SIZE;
      setView((w) => {
        const mpp = clamp(w.mpp * (e.deltaY > 0 ? 1.25 : 0.8), CLOSEST, FULL);
        // Keep the spot under the pointer where it is.
        return {
          mpp,
          x: w.x + (px - SIZE / 2) * (w.mpp - mpp),
          z: w.z - (py - SIZE / 2) * (w.mpp - mpp),
        };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const at = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      u: ((e.clientX - rect.left) / rect.width) * SIZE,
      v: ((e.clientY - rect.top) / rect.height) * SIZE,
    };
  };

  const zoom = (factor: number) =>
    setView((w) => ({ ...w, mpp: clamp(w.mpp * factor, CLOSEST, FULL) }));

  return (
    <div>
      <canvas
        ref={canvas}
        width={SIZE}
        height={SIZE}
        className={styles.canvas}
        data-placing={placing || undefined}
        role="img"
        aria-label="Map of the world. Drag to move, scroll or use the buttons to zoom."
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          const p = at(e);
          drag.current = { id: e.pointerId, ...p, u0: p.u, v0: p.v };
        }}
        onPointerMove={(e) => {
          const p = at(e);
          const d = drag.current;
          if (d && d.id === e.pointerId) {
            drag.current = { ...d, ...p };
            setView((w) => ({ ...w, x: w.x - (p.u - d.u) * w.mpp, z: w.z + (p.v - d.v) * w.mpp }));
          }
          setCursor({
            x: view.x + (p.u - SIZE / 2) * view.mpp,
            z: view.z - (p.v - SIZE / 2) * view.mpp,
          });
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          drag.current = null;
          if (!placing || !d) return;
          const p = at(e);
          // A click, not the end of a drag.
          if (Math.hypot(p.u - d.u0, p.v - d.v0) > CLICK_SLOP) return;
          onPlace({
            x: view.x + (p.u - SIZE / 2) * view.mpp,
            z: view.z - (p.v - SIZE / 2) * view.mpp,
          });
        }}
        onPointerCancel={() => (drag.current = null)}
        onPointerLeave={() => setCursor(null)}
      />
      <div className={styles.mapBar}>
        <button
          type="button"
          className={styles.button}
          onClick={() => zoom(0.6)}
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          className={styles.button}
          onClick={() => zoom(1 / 0.6)}
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          type="button"
          className={styles.button}
          onClick={() => setView({ x: 0, z: 0, mpp: FULL })}
        >
          Whole world
        </button>
        {reference && (
          <button
            type="button"
            className={styles.button}
            onClick={() => setView({ x: reference.x, z: reference.z, mpp: 6 })}
          >
            Centre on me
          </button>
        )}
        <span className={styles.dim} aria-live="off">
          {cursor
            ? `east ${Math.round(cursor.x)}, north ${Math.round(cursor.z)}${
                reference
                  ? ` · ${formatDistance(metresBetween(reference, cursor))} ${direction(reference, cursor)} of you`
                  : ''
              }`
            : 'Drag to move'}
        </span>
      </div>
    </div>
  );
}
