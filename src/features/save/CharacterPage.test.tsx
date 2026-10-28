// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { gameData, saveKeys } from '../../data/load';
import { appStore } from '../../state/store';
import { importCharacter } from './character';
import { CharacterPage } from './CharacterPage';
import { parseCharacter } from './fch';
import { buildFile } from './testFile';

const show = () =>
  render(
    <MemoryRouter>
      <CharacterPage />
    </MemoryRouter>,
  );

describe('CharacterPage', () => {
  afterEach(cleanup);

  it('offers the file picker and says no character is read yet', () => {
    show();
    expect(screen.getByRole('heading', { name: 'My character' })).toBeTruthy();
    expect(screen.getByLabelText('Choose a character file')).toBeTruthy();
    expect(screen.getByText(/No character read for this profile yet/)).toBeTruthy();
  });

  it('shows the gear, skills and progress after a character is applied, and ticks the checklist', () => {
    const imp = importCharacter(parseCharacter(buildFile()), gameData, saveKeys, new Date('2026-10-28T12:00:00Z'));
    appStore.getState().applyCharacter(imp);
    show();
    expect(screen.getByRole('heading', { name: /Venom/ })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Gear worn' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Hammer' })).toBeTruthy();
    expect(screen.getByLabelText('Woodcutting 50 of 100')).toBeTruthy();
    const state = appStore.getState();
    const profile = state.profiles[state.active]!;
    expect(profile.character?.name).toBe('Venom');
    expect(profile.progress['Wood']?.collected).toBe(true);
    expect(profile.progress['AxeBronze']?.crafted).toBe(true);
  });

  it('puts a second character in its own profile and a re-read in the same one', () => {
    const imp = importCharacter(parseCharacter(buildFile()), gameData, saveKeys, new Date());
    const before = appStore.getState().order.length;
    appStore.getState().applyCharacter(imp);
    expect(appStore.getState().order.length).toBe(before);
    appStore.getState().applyCharacter({ ...imp, snapshot: { ...imp.snapshot, name: 'Other' } });
    expect(appStore.getState().order.length).toBe(before + 1);
    expect(appStore.getState().profiles[appStore.getState().active]!.name).toBe('Other');
  });
});
