// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { getRecent, pushRecent } from './recent';

beforeEach(() => localStorage.clear());

describe('recent', () => {
  it('starts empty', () => {
    expect(getRecent()).toEqual([]);
  });

  it('keeps newest first without duplicates and caps the list', () => {
    for (const id of ['a', 'b', 'c', 'a']) pushRecent(id);
    expect(getRecent()).toEqual(['a', 'c', 'b']);
    for (let i = 0; i < 20; i++) pushRecent(`x${i}`);
    expect(getRecent()).toHaveLength(8);
  });

  it('survives corrupt storage', () => {
    localStorage.setItem('vcs:v1:recent', '{not json');
    expect(getRecent()).toEqual([]);
    localStorage.setItem('vcs:v1:recent', '{"a":1}');
    expect(getRecent()).toEqual([]);
  });
});
