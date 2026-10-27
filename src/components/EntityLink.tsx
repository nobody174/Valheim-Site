import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import { describeEntity } from '../data/describe';
import { lookup, type EntityKind } from '../data/lookup';
import { effectiveHoard } from '../state/model';
import { useProfile } from '../state/store';
import { HoardBadge } from './Badges';
import { EntityIcon } from './EntityIcon';
import styles from './EntityLink.module.css';

export function entityPath(kind: EntityKind, id: string): string {
  return `/${kind}/${encodeURIComponent(id)}`;
}

const LONG_PRESS_MS = 450;
const TIP_WIDTH = 288;

function Tip({ id, anchor, tipId }: { id: string; anchor: DOMRect; tipId: string }) {
  const profile = useProfile();
  const info = describeEntity(id);
  if (!info) return null;
  const item = info.itemId ? lookup.item(info.itemId) : undefined;

  const left = Math.max(8, Math.min(anchor.left, window.innerWidth - TIP_WIDTH - 8));
  const below = anchor.bottom < window.innerHeight - 200;
  const style = below
    ? { left, top: anchor.bottom + 6 }
    : { left, bottom: window.innerHeight - anchor.top + 6 };

  return createPortal(
    <div role="tooltip" id={tipId} className={styles.tip} style={style}>
      <span className={styles.head}>
        <EntityIcon id={id} size={40} />
        <span className={styles.headText}>
          <strong className={styles.title}>{info.title}</strong>
          <span className={styles.subtitle}>{info.subtitle}</span>
        </span>
      </span>
      {info.lines.map((line) => (
        <span key={line} className={styles.line}>
          {line}
        </span>
      ))}
      {item && (
        <span className={styles.line}>
          <HoardBadge
            hoard={effectiveHoard(item, profile)}
            qty={item.recommendedQty}
            custom={item.id in profile.hoardOverrides}
          />
        </span>
      )}
    </div>,
    document.body,
  );
}

/**
 * Every item, creature, boss and station name in the app renders through this link. Hovering or
 * focusing it shows a small fact card; on touch screens, a long press shows the card instead of
 * following the link.
 */
export function EntityLink({ id }: { id: string }) {
  const ref = lookup.entity(id);
  const anchor = useRef<HTMLAnchorElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const longPressed = useRef(false);
  const tipId = useId();

  const show = () => {
    if (anchor.current) setRect(anchor.current.getBoundingClientRect());
  };
  const hide = () => setRect(null);
  const cancelPress = () => window.clearTimeout(timer.current);

  useEffect(() => cancelPress, []);
  useEffect(() => {
    if (!rect) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && hide();
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('pointerdown', hide);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('pointerdown', hide);
    };
  }, [rect]);

  if (!ref) return <span title="Unknown reference">{id}</span>;

  return (
    <>
      <Link
        ref={anchor}
        to={entityPath(ref.kind, id)}
        aria-describedby={rect ? tipId : undefined}
        onPointerEnter={(e) => e.pointerType === 'mouse' && show()}
        onPointerLeave={(e) => {
          cancelPress();
          if (e.pointerType === 'mouse') hide();
        }}
        onFocus={show}
        onBlur={hide}
        onPointerDown={(e) => {
          if (e.pointerType !== 'touch') return;
          longPressed.current = false;
          timer.current = window.setTimeout(() => {
            longPressed.current = true;
            show();
          }, LONG_PRESS_MS);
        }}
        onPointerUp={cancelPress}
        onPointerCancel={cancelPress}
        onClick={(e) => {
          if (longPressed.current) {
            e.preventDefault();
            longPressed.current = false;
          }
        }}
        onContextMenu={(e) => longPressed.current && e.preventDefault()}
      >
        <EntityIcon id={id} size={20} />
        <span className={styles.name}>{ref.name}</span>
      </Link>
      {rect && <Tip id={id} anchor={rect} tipId={tipId} />}
    </>
  );
}
