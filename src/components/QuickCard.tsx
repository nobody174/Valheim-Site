import { quickCard, quickText, type QuickLine } from '../data/quick';
import { EntityLink } from './EntityLink';
import styles from './QuickCard.module.css';

const GUIDE_TITLE = 'Written by hand from guides; not checked in game';

function Parts({ line, onMore }: { line: QuickLine; onMore?: () => void }) {
  return (
    <>
      {line.parts.map((p, i) => {
        if (typeof p === 'string') return <span key={i}>{p}</span>;
        if ('id' in p) return <EntityLink key={i} id={p.id} />;
        return onMore ? (
          <button key={i} type="button" className={styles.more} onClick={onMore}>
            +{p.more} more
          </button>
        ) : (
          <span key={i}>+{p.more} more</span>
        );
      })}
      {line.guide && (
        <span className={styles.guide} title={GUIDE_TITLE}>
          guide
        </span>
      )}
    </>
  );
}

/** FARM / USED FOR / MAKE in three short lines. A missing line means nothing is known, never a guess. */
export function QuickCard({ id, onMore }: { id: string; onMore?: () => void }) {
  const card = quickCard(id);
  const rows = [
    ['Farm', card.farm],
    ['Used for', card.usedFor],
    ['Make', card.make],
  ] as const;
  return (
    <dl className={styles.card}>
      {rows.map(([name, line]) =>
        line ? (
          <div key={name} className={styles.row} data-row={name}>
            <dt>{name}</dt>
            <dd>
              <Parts line={line} onMore={onMore} />
            </dd>
          </div>
        ) : null,
      )}
    </dl>
  );
}

/** One truncated line of plain text for cards and tables. */
export function QuickSummary({ line }: { line: QuickLine | undefined }) {
  if (!line) return null;
  return (
    <span className={styles.summary} title={quickText(line)}>
      {quickText(line)}
      {line.guide && <span className={styles.guide}>guide</span>}
    </span>
  );
}

/** A quick line without the label, for table-like rows. */
export function QuickLineView({ line }: { line: QuickLine | undefined }) {
  if (!line) return <span className={styles.none}>-</span>;
  return (
    <span className={styles.cell}>
      <Parts line={line} />
    </span>
  );
}
