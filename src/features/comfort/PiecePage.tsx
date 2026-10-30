import { Link, useParams } from 'react-router';
import { VerifiedBadge } from '../../components/Badges';
import { EntityIcon } from '../../components/EntityIcon';
import { lookup } from '../../data/lookup';
import styles from '../items/Items.module.css';
import { PieceCard } from './PieceCard';

export function PiecePage() {
  const { id = '' } = useParams();
  const piece = lookup.piece(id);
  if (!piece) {
    return (
      <section className={styles.page}>
        <h1>Unknown building piece</h1>
        <p>No building piece with id &quot;{id}&quot;.</p>
      </section>
    );
  }
  return (
    <article className={styles.page}>
      <header className={styles.title}>
        <span className={styles.iconFrame}>
          <EntityIcon id={piece.id} size={64} />
        </span>
        <h1>{piece.name}</h1>
      </header>
      <div className={styles.badges}>
        <span className={styles.dim}>Building piece · {piece.category}</span>
        <VerifiedBadge level={piece.verified} note={piece.note} />
      </div>
      <PieceCard piece={piece} />
      {piece.comfort ? (
        <p className={styles.dim}>
          <Link to="/comfort">Open the comfort planner</Link> to add it up with the rest of the
          room.
        </p>
      ) : null}
    </article>
  );
}
