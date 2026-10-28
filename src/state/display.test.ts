// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyDisplay, loadDisplay, saveDisplay } from './display';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  delete document.documentElement.dataset.screen;
});

describe('display settings', () => {
  it('starts with second-screen mode off', () => {
    expect(loadDisplay()).toEqual({ secondScreen: false, view: 'cards' });
  });

  it('remembers what was saved', () => {
    saveDisplay({ secondScreen: true, view: 'list' });
    expect(loadDisplay()).toEqual({ secondScreen: true, view: 'list' });
  });

  it('ignores a corrupt stored value', () => {
    localStorage.setItem('vcs:v1:display', '{nope');
    expect(loadDisplay()).toEqual({ secondScreen: false, view: 'cards' });
    localStorage.setItem('vcs:v1:display', JSON.stringify({ secondScreen: 'yes' }));
    expect(loadDisplay()).toEqual({ secondScreen: false, view: 'cards' });
  });

  it('survives blocked storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(loadDisplay()).toEqual({ secondScreen: false, view: 'cards' });
    expect(() => saveDisplay({ secondScreen: true, view: 'cards' })).not.toThrow();
  });

  it('puts the setting on the page for the stylesheet', () => {
    applyDisplay({ secondScreen: true, view: 'cards' });
    expect(document.documentElement.dataset.screen).toBe('second');
    applyDisplay({ secondScreen: false, view: 'cards' });
    expect(document.documentElement.dataset.screen).toBe('normal');
  });
});
