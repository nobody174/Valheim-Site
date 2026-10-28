// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { commands, skillsFile } from '../../data/load';
import { lookup } from '../../data/lookup';
import { skillLabel } from '../../data/skills';
import { CommandsPage } from '../commands/CommandsPage';
import { SkillsPage } from './SkillsPage';

const at = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('skills data', () => {
  it('gives every skill a game description and a training rate', () => {
    for (const s of skillsFile.skills) {
      expect(s.name, s.id).not.toBe(s.id.length ? '' : s.id);
      expect(s.description, s.id).not.toBe('');
      expect(s.xpPerUse, s.id).not.toBeNull();
    }
  });

  it('knows every skill a weapon uses (a wrong skill name would show as raw text)', () => {
    const ids = new Set(skillsFile.skills.map((s) => s.id));
    for (const w of lookup.allWeapons()) if (w.skill !== 'None') expect(ids.has(w.skill), `${w.item}: ${w.skill}`).toBe(true);
  });

  it('labels the magic skills as the game does', () => {
    expect(skillLabel('ElementalMagic')).toBe('Elemental Magic');
    expect(skillLabel('BloodMagic')).toBe('Blood Magic');
    expect(skillLabel('Nope')).toBe('Nope');
  });
});

describe('SkillsPage', () => {
  afterEach(cleanup);
  it('lists skills by group with the death loss and a weapon link', () => {
    at(<SkillsPage />);
    expect(screen.getByRole('heading', { name: 'Skills' })).toBeTruthy();
    expect(screen.getByText(/loses 5% of its level/)).toBeTruthy();
    const row = screen.getByRole('cell', { name: 'Swords' }).closest('tr')!;
    expect(within(row).getByText('Damage with swords.')).toBeTruthy();
    expect(within(row).getAllByRole('link').length).toBeGreaterThan(0);
  });
});

describe('commands data', () => {
  it('has the basics, unique names, and marks cheats', () => {
    const names = commands.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toEqual(expect.arrayContaining(['help', 'devcommands'.replace('devcommands', 'spawn'), 'goto']));
    expect(commands.find((c) => c.name === 'spawn')!.cheat).toBe(true);
    expect(commands.find((c) => c.name === 'help')!.cheat).toBe(false);
  });
});

describe('CommandsPage', () => {
  afterEach(cleanup);
  it('filters by text and by whether devcommands is needed', async () => {
    at(<CommandsPage />);
    const user = userEvent.setup();
    expect(screen.getByRole('heading', { name: 'Console commands' })).toBeTruthy();
    await user.type(screen.getByPlaceholderText(/spawn, skill/), 'teleport');
    expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
    expect(screen.queryByText('devcommands', { selector: 'td code' })).toBeNull();
    await user.selectOptions(screen.getByRole('combobox'), 'plain');
    for (const row of screen.getAllByRole('row').slice(1)) expect(within(row).queryByText('needs devcommands')).toBeNull();
    await user.clear(screen.getByPlaceholderText(/spawn, skill/));
    await user.type(screen.getByPlaceholderText(/spawn, skill/), 'zzzzzz');
    expect(screen.getByText('No command matches that.')).toBeTruthy();
  });
});
