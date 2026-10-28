// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';

// React Flow needs a real layout engine; here only the nodes and edges handed to it matter.
vi.mock('@xyflow/react', () => ({
  ReactFlow: ({ nodes, edges, onNodeClick }: { nodes: { id: string; data: { label: string } }[]; edges: { id: string; label: string }[]; onNodeClick: (e: unknown, n: { id: string }) => void }) => (
    <div data-testid="flow">
      {nodes.map((n) => (
        <button key={n.id} type="button" onClick={(e) => onNodeClick(e, n)}>
          node:{n.data.label}
        </button>
      ))}
      {edges.map((e) => (
        <span key={e.id}>edge:{e.label}</span>
      ))}
    </div>
  ),
  Background: () => null,
  Controls: () => null,
  MiniMap: () => null,
  Handle: () => null,
  Position: { Left: 'left', Right: 'right' },
  MarkerType: { ArrowClosed: 'arrowclosed' },
}));
vi.mock('@xyflow/react/dist/style.css', () => ({}));

import { GraphPage } from './GraphPage';

afterEach(cleanup);

const renderPage = (path = '/graph') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <GraphPage />
    </MemoryRouter>,
  );

describe('graph page', () => {
  it('asks for an item first', () => {
    renderPage();
    expect(screen.getByText(/Choose an item to draw/)).toBeTruthy();
  });

  it('draws the ingredients of an item with the station and level on the edges', () => {
    renderPage('/graph?item=Bronze');
    const flow = screen.getByTestId('flow');
    expect(within(flow).getByText('node:Bronze')).toBeTruthy();
    expect(within(flow).getByText('node:Copper')).toBeTruthy();
    expect(within(flow).getByText('node:Tin')).toBeTruthy();
    expect(within(flow).getAllByText(/edge:\d+× · Forge 1/).length).toBeGreaterThan(0);
  });

  it('shows what an item unlocks in Unlocks mode', () => {
    renderPage('/graph?item=Tin&mode=unlocks');
    expect(within(screen.getByTestId('flow')).getByText('node:Bronze')).toBeTruthy();
  });

  it('selecting a node offers its page and an expand step when there is more', async () => {
    const user = userEvent.setup();
    renderPage('/graph?item=SwordBronze&depth=1');
    await user.click(screen.getByRole('button', { name: 'node:Bronze' }));
    expect(screen.getByRole('link', { name: 'Open page' }).getAttribute('href')).toBe('/item/Bronze');
    await user.click(screen.getByRole('button', { name: 'Expand one more step' }));
    expect(within(screen.getByTestId('flow')).getByText('node:Copper')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Collapse' })).toBeTruthy();
  });

  it('lists every node as a plain link for keyboard and screen-reader users', () => {
    renderPage('/graph?item=Bronze');
    const list = screen.getByText(/List view/).closest('details')!;
    expect(within(list).getByRole('link', { name: 'Copper' }).getAttribute('href')).toBe('/item/Copper');
  });
});
