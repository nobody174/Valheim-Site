import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { gameData } from '../../data/load';
import { lookup } from '../../data/lookup';
import styles from '../items/Items.module.css';

/** The text a player sends to the site owner: what page, which game build, and what looks wrong. */
export function correctionText(name: string, id: string, build: string, what: string): string {
  return `Valheim Companion correction\nPage: ${name} (${id})\nData: ${build}\nWhat looks wrong: ${what.trim() || '(write it here)'}`;
}

/** Report a wrong value: there is no server, so the page builds a note to copy and send. */
export function CorrectionsPage() {
  const [params] = useSearchParams();
  const id = params.get('id') ?? '';
  const known = id ? lookup.entity(id) : undefined;
  const name = known?.name ?? (id || 'a page');
  const [what, setWhat] = useState('');
  const [copied, setCopied] = useState(false);
  const text = correctionText(name, id || 'unknown', gameData.meta.gameVersion, what);

  return (
    <div>
      <h1>Report a wrong value</h1>
      <p>
        A wrong recipe is worse than a missing one, so a report is always welcome. This site has no
        server, so write what looks wrong, copy the note and send it to whoever runs the site.
      </p>
      {known && (
        <p>
          About: <Link to={`/${known.kind}/${known.id}`}>{known.name}</Link>
        </p>
      )}
      <label>
        What looks wrong?
        <br />
        <textarea
          rows={5}
          style={{ width: '100%', maxWidth: '40rem' }}
          value={what}
          onChange={(e) => {
            setWhat(e.target.value);
            setCopied(false);
          }}
          placeholder="For example: the recipe needs 4 Core Wood in game, the site says 5"
        />
      </label>
      <pre className={styles.dimNote} style={{ whiteSpace: 'pre-wrap' }}>
        {text}
      </pre>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard?.writeText(text).then(() => setCopied(true));
        }}
      >
        {copied ? 'Copied' : 'Copy the note'}
      </button>
      <p>
        You can also mark what matches or differs on <Link to="/spotcheck">Check in game</Link>, and
        see how everything is checked on <Link to="/trust">Data trust</Link>.
      </p>
    </div>
  );
}
