import { EntityLink } from '../../components/EntityLink';
import { lookup } from '../../data/lookup';
import type { Piece } from '../../data/schemas';
import styles from '../../components/QuickCard.module.css';

/** MAKE / COMFORT / GROUP in three short lines for one building piece. */
export function PieceCard({ piece }: { piece: Piece }) {
  const others = piece.comfortGroup
    ? lookup
        .allPieces()
        .filter((p) => p.comfortGroup === piece.comfortGroup && p.id !== piece.id && p.comfort)
    : [];
  return (
    <dl className={styles.card}>
      <div className={styles.row} data-row="Make">
        <dt>Make</dt>
        <dd>
          Hammer
          {piece.station && (
            <>
              {', near '}
              <EntityLink id={piece.station} />
            </>
          )}
          {': '}
          {piece.requirements.map((g, i) => (
            <span key={g.item}>
              {i ? ', ' : ''}
              {g.qty} <EntityLink id={g.item} />
            </span>
          ))}
        </dd>
      </div>
      {piece.comfort && (
        <div className={styles.row} data-row="Comfort">
          <dt>Comfort</dt>
          <dd>+{piece.comfort}</dd>
        </div>
      )}
      {piece.comfortGroup && (
        <div className={styles.row} data-row="Group">
          <dt>Group</dt>
          <dd>
            {piece.comfortGroup}: only the strongest counts.
            {others.length > 0 && (
              <>
                {' Also in it: '}
                {others.slice(0, 4).map((p, i) => (
                  <span key={p.id}>
                    {i ? ', ' : ''}
                    <EntityLink id={p.id} />
                  </span>
                ))}
                {others.length > 4 && ` +${others.length - 4} more`}
              </>
            )}
          </dd>
        </div>
      )}
    </dl>
  );
}
