import { Link } from 'react-router';
import { EntityLink } from '../../components/EntityLink';
import { skillsFile } from '../../data/load';
import { lookup } from '../../data/lookup';
import { skillRange } from '../../data/weaponStats';
import { useProfile } from '../../state/store';
import styles from '../items/Items.module.css';

const GROUPS: { id: (typeof skillsFile.skills)[number]['group']; title: string }[] = [
  { id: 'weapon', title: 'Weapon skills' },
  { id: 'combat', title: 'Defence' },
  { id: 'tool', title: 'Tools' },
  { id: 'movement', title: 'Movement' },
  { id: 'life', title: 'Crafting and survival' },
];

const LEVELS = [0, 25, 50, 75, 100];
const MAX_WEAPONS = 8;
const pct = (n: number) => `${Math.round(n * 100)}%`;

/** What each skill does, how fast it trains, which weapons use it, and the character's level in it. */
export function SkillsPage() {
  const character = useProfile().character;
  const weapons = lookup.allWeapons();

  return (
    <div>
      <h1>Skills</h1>
      <p>
        Descriptions and training rates are read from the game files. On death every skill loses{' '}
        {pct(skillsFile.deathLoss)} of its level.
        {character
          ? ` The Level column is ${character.name}'s, from the character file.`
          : (
            <>
              {' '}
              Read your character on <Link to="/character">My character</Link> to see your levels here.
            </>
          )}
      </p>

      <h2>How a weapon skill adds damage</h2>
      <p>
        Each hit rolls between a low and a high share of the weapon&apos;s listed damage. Both rise with the skill
        level (the same numbers the in-game tooltip shows):
      </p>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Skill level</th>
              {LEVELS.map((l) => (
                <th key={l}>{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Share of listed damage</td>
              {LEVELS.map((l) => {
                const r = skillRange(l);
                return (
                  <td key={l}>
                    {pct(r.min)} to {pct(r.max)}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {GROUPS.map((g) => {
        const skills = skillsFile.skills.filter((s) => s.group === g.id);
        if (skills.length === 0) return null;
        return (
          <section key={g.id}>
            <h2>{g.title}</h2>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Skill</th>
                    <th>What it does</th>
                    <th>Gain per use</th>
                    {character && <th>Level</th>}
                    <th>Weapons</th>
                  </tr>
                </thead>
                <tbody>
                  {skills.map((s) => {
                    const used = weapons.filter((w) => w.skill === s.id);
                    return (
                      <tr key={s.id}>
                        <td>{s.name}</td>
                        <td>{s.description || ' '}</td>
                        <td>{s.xpPerUse ?? ' '}</td>
                        {character && <td>{character.skills[s.name] ?? ' '}</td>}
                        <td>
                          {used.slice(0, MAX_WEAPONS).map((w, i) => (
                            <span key={w.item}>
                              {i > 0 && ', '}
                              <EntityLink id={w.item} />
                            </span>
                          ))}
                          {used.length > MAX_WEAPONS && (
                            <>
                              {' '}
                              and {used.length - MAX_WEAPONS} more (see <Link to="/rankings">Rankings</Link>)
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
