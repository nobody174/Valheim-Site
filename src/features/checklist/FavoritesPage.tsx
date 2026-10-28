import { EntityLink } from '../../components/EntityLink';
import { Intro } from '../../components/Intro';
import { lookup } from '../../data/lookup';
import { FavoriteStar } from '../items/ItemActions';
import { useProfile } from '../../state/store';
import styles from '../items/Items.module.css';

function recipeLabel(recipeId: string): string {
  const r = lookup.recipe(recipeId);
  return r ? (lookup.item(r.output.item)?.name ?? recipeId) : recipeId;
}

export function FavoritesPage() {
  const profile = useProfile();
  const { materials, recipes, gear } = profile.favorites;
  const none = materials.length + recipes.length + gear.length === 0;

  return (
    <section>
      <h1>Favorites</h1>
      <Intro>
        <p>
        Your starred items and recipes for the profile <strong>{profile.name}</strong>. Star things
        from any item page or recipe card.
        </p>
      </Intro>
      {none && (
        <p className={styles.empty}>Nothing starred yet. Open an item and press the star.</p>
      )}

      {materials.length > 0 && (
        <section className={styles.section}>
          <h2>Materials and other items</h2>
          <ul className={styles.inline}>
            {materials.map((id) => (
              <li key={id}>
                <FavoriteStar kind="materials" id={id} label={lookup.item(id)?.name ?? id} />
                <EntityLink id={id} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {gear.length > 0 && (
        <section className={styles.section}>
          <h2>Gear</h2>
          <ul className={styles.inline}>
            {gear.map((id) => (
              <li key={id}>
                <FavoriteStar kind="gear" id={id} label={lookup.item(id)?.name ?? id} />
                <EntityLink id={id} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {recipes.length > 0 && (
        <section className={styles.section}>
          <h2>Recipes</h2>
          <ul className={styles.inline}>
            {recipes.map((id) => {
              const r = lookup.recipe(id);
              return (
                <li key={id}>
                  <FavoriteStar kind="recipes" id={id} label={recipeLabel(id)} />
                  {r ? <EntityLink id={r.output.item} /> : id}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </section>
  );
}
