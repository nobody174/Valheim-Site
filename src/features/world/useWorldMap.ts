import { useCallback, useEffect, useMemo, useState } from 'react';
import { clearMapFiles, getMapFiles, putMapFiles } from '../../state/worldMap';
import { FchError } from '../save/fch';
import { parseMapData, type SavedMap } from './mapData';
import { decodeTerrain, MAP_SIZE, renderTerrain, type Fog, type Terrain } from './terrain';

const PART = { biome: /biome/i, mask: /mask/i, height: /height/i } as const;

/** The game's map of the world: the land (from the three cache files) and what the character has explored and pinned. */
export function useWorldMap(profile: string, fog: Fog) {
  const [terrain, setTerrain] = useState<Terrain | null>(null);
  const [saved, setSaved] = useState<SavedMap | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    void getMapFiles(profile).then(async (found) => {
      try {
        // A profile without a stored map shows none, rather than the last profile's.
        const t =
          found.biome && found.mask && found.height
            ? await decodeTerrain({ biome: found.biome, mask: found.mask, height: found.height })
            : null;
        const s = found.saved ? await parseMapData(found.saved) : null;
        if (live) {
          setTerrain(t);
          setSaved(s);
        }
      } catch {
        // Stale or damaged copy: the files can simply be picked again.
      }
    });
    return () => {
      live = false;
    };
  }, [profile]);

  /** Take the three `cacheMinimap...` files, picked together. */
  const addTerrainFiles = useCallback(
    async (files: File[]) => {
      setError('');
      try {
        const pick = (re: RegExp) =>
          files.find((f) => f.name.toLowerCase().startsWith('cacheminimap') && re.test(f.name));
        const [biome, mask, height] = [pick(PART.biome), pick(PART.mask), pick(PART.height)];
        if (!biome || !mask || !height) {
          throw new FchError(
            'Pick all three files together: cacheMinimapBiome, cacheMinimapMask and cacheMinimapHeight.',
          );
        }
        const bytes = {
          biome: new Uint8Array(await biome.arrayBuffer()),
          mask: new Uint8Array(await mask.arrayBuffer()),
          height: new Uint8Array(await height.arrayBuffer()),
        };
        setTerrain(await decodeTerrain(bytes));
        await putMapFiles(profile, bytes);
      } catch (e) {
        setError(e instanceof FchError ? e.message : 'Could not read those map files.');
      }
    },
    [profile],
  );

  /** Take the map a character file holds (explored area and pins). */
  const addSavedMap = useCallback(
    async (bytes: Uint8Array) => {
      try {
        setSaved(await parseMapData(bytes));
        await putMapFiles(profile, { saved: bytes });
      } catch (e) {
        setError(e instanceof FchError ? e.message : 'Could not read the character’s map.');
      }
    },
    [profile],
  );

  const forget = useCallback(() => {
    setTerrain(null);
    setSaved(null);
    void clearMapFiles(profile);
  }, [profile]);

  const explored = saved?.explored ?? null;
  const image = useMemo(() => {
    if (!terrain || typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = MAP_SIZE;
    canvas.height = MAP_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const pixels = renderTerrain(terrain, explored, fog);
    ctx.putImageData(
      new ImageData(pixels as Uint8ClampedArray<ArrayBuffer>, MAP_SIZE, MAP_SIZE),
      0,
      0,
    );
    return canvas;
  }, [terrain, explored, fog]);

  return {
    terrain,
    image,
    hasTerrain: terrain !== null,
    saved,
    error,
    addTerrainFiles,
    addSavedMap,
    forget,
  };
}
