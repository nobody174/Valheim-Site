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
    expect(loadDisplay()).toEqual({ secondScreen: false });
  });

  it('remembers what was saved', () => {
    saveDisplay({ secondScreen: true });
    expect(loadDisplay()).toEqual({ secondScreen: true });
  });

  it('ignores a corrupt stored value', () => {
    localStorage.setItem('vcs:v1:display', '{nope');
    expect(loadDisplay()).toEqual({ secondScreen: false });
    localStorage.setItem('vcs:v1:display', JSON.stringify({ secondScreen: 'yes' }));
    expect(loadDisplay()).toEqual({ secondScreen: false });
  });

  it('survives blocked storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(loadDisplay()).toEqual({ secondScreen: false });
    expect(() => saveDisplay({ secondScreen: true })).not.toThrow();
  });

  it('puts the setting on the page for the stylesheet', () => {
    applyDisplay({ secondScreen: true });
    expect(document.documentElement.dataset.screen).toBe('second');
    applyDisplay({ secondScreen: false });
    expect(document.documentElement.dataset.screen).toBe('normal');
  });
});
