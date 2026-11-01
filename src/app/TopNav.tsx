import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { EntityIcon } from '../components/EntityIcon';
import { MENU, pagesOf } from './menu';
import styles from './TopNav.module.css';

/**
 * The top menu: one button per task, each opening a list of pages. A click or Enter opens it, hovering
 * opens it with a mouse, Escape or a click elsewhere closes it, and going to a page closes it too.
 */
export function TopNav() {
  const { pathname } = useLocation();
  const [openAt, setOpenAt] = useState<{ id: string; path: string } | null>(null);
  const open = openAt && openAt.path === pathname ? openAt.id : null;
  const bar = useRef<HTMLElement>(null);
  const setOpen = (id: string | null) => setOpenAt(id ? { id, path: pathname } : null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenAt(null);
    const onDown = (e: PointerEvent) => {
      if (!bar.current?.contains(e.target as Node)) setOpenAt(null);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  return (
    <nav ref={bar} className={styles.bar} aria-label="Main">
      <ul className={styles.list}>
        {MENU.map((s) => {
          const here = s.paths.includes(pathname);
          return (
            <li
              key={s.id}
              className={styles.item}
              onMouseEnter={(e) => {
                if (e.nativeEvent instanceof MouseEvent) setOpen(s.id);
              }}
              onMouseLeave={() => setOpen(null)}
            >
              <button
                type="button"
                className={`${styles.button} ${here ? styles.here : ''}`}
                aria-expanded={open === s.id}
                aria-controls={`menu-${s.id}`}
                onClick={() => setOpen(open === s.id ? null : s.id)}
              >
                {s.label}
                <span className={styles.caret} aria-hidden="true" />
              </button>
              {open === s.id && (
                <ul id={`menu-${s.id}`} className={styles.drop}>
                  {pagesOf(s).map((r) => (
                    <li key={r.path}>
                      <NavLink
                        to={r.path}
                        end
                        className={({ isActive }) => (isActive ? styles.active : undefined)}
                      >
                        <EntityIcon id={r.icon} size={22} />
                        <span>{r.label}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
