import { Link } from 'react-router';
import { EntityIcon } from '../../components/EntityIcon';
import { entityPath } from '../../components/EntityLink';
import { updateLog } from '../../data/load';
import { lookup } from '../../data/lookup';
import styles from './Search.module.css';

const TASKS = [
  {
    to: '/items',
    label: 'Find an item',
    hint: 'What it does and where it comes from',
    icon: 'Wood',
  },
  {
    to: '/recipes',
    label: 'Make something',
    hint: 'What to bring to the workbench',
    icon: 'Flint',
  },
  {
    to: '/bosses',
    label: 'Beat a boss',
    hint: 'What to summon it with and bring',
    icon: 'TrophyEikthyr',
  },
  {
    to: '/building',
    label: 'Build a base',
    hint: 'Pieces, comfort and what they cost',
    icon: 'Stone',
  },
  {
    to: '/food',
    label: 'Eat well',
    hint: 'Food, mead and the best three foods',
    icon: 'CookedMeat',
  },
  {
    to: '/world',
    label: 'Explore the world',
    hint: 'Read your own world and map',
    icon: 'piece_cartographytable',
  },
];

const TOOLS = [
  {
    to: '/planner',
    label: 'Build planner',
    hint: 'Add pieces, get the shopping list',
    icon: 'Hammer',
  },
  {
    to: '/optimizer',
    label: 'Food optimizer',
    hint: 'The best three foods for you',
    icon: 'MeadHealthMinor',
  },
  { to: '/graph', label: 'Crafting graph', hint: 'What goes into what', icon: 'Amber' },
];

function Cards({ list }: { list: typeof TASKS }) {
  return (
    <div className={styles.tools}>
      {list.map((t) => (
        <Link key={t.to} to={t.to} className={styles.tool}>
          <EntityIcon id={t.icon} size={40} />
          <span className={styles.toolText}>
            <span className={styles.toolName}>{t.label}</span>
            <span className={styles.zoneMeta}>{t.hint}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}

/** Six jobs a player arrives with, each one click from the page that does it. */
export function TaskCards() {
  return (
    <>
      <h2 className={styles.sectionTitle}>What do you want to do?</h2>
      <Cards list={TASKS} />
    </>
  );
}

/** A round icon per boss, in the order the game meets them. */
export function BossRow() {
  const bosses = [...lookup.allBosses()];
  return (
    <>
      <h2 className={styles.sectionTitle}>Bosses</h2>
      <ul className={styles.bossRow}>
        {bosses.map((b) => (
          <li key={b.id}>
            <Link to={entityPath('boss', b.id)} className={styles.bossLink}>
              <EntityIcon id={b.id} size={44} />
              <span>{b.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Three of the planning tools, so they are found without opening a menu. */
export function ToolPreview() {
  return (
    <>
      <h2 className={styles.sectionTitle}>Tools</h2>
      <Cards list={TOOLS} />
    </>
  );
}

/** The newest data update, so a returning player sees at once whether anything changed. */
export function LatestUpdate() {
  const latest = updateLog.entries[0];
  if (!latest) return null;
  return (
    <>
      <h2 className={styles.sectionTitle}>What is new</h2>
      <p className={styles.zoneMeta}>
        Data built for game version {latest.gameVersion} ({latest.date}).{' '}
        <Link to="/updates">See the update log</Link>
      </p>
    </>
  );
}
