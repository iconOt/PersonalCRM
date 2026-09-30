import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import Organizations from '../pages/Organizations';
import Pipeline from '../pages/Pipeline';
import { api } from '../api/client';

/**
 * These tests mock the data layer, so they run offline and in milliseconds. They cover
 * the behaviour the live-backend suite in client.test.ts cannot reach: what the pages
 * do when an InsForge request fails.
 */

vi.mock('../api/client', () => ({
  api: {
    organizations: {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    deals: {
      list: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const mockedList = vi.mocked(api.organizations.list);

function renderOrganizations() {
  return render(
    <MemoryRouter>
      <Organizations />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Organizations page', () => {
  it('lists the organizations returned by InsForge', async () => {
    mockedList.mockResolvedValue([
      { id: 'o1', name: 'Acme Corporation', industry: 'Technology', website: 'acme.test' },
      { id: 'o2', name: 'Summit Healthcare', industry: 'Healthcare', website: '' },
    ] as any);

    renderOrganizations();

    expect(await screen.findByText('Acme Corporation')).toBeInTheDocument();
    expect(screen.getByText('Summit Healthcare')).toBeInTheDocument();
    expect(screen.queryByText('No organizations found')).not.toBeInTheDocument();
  });

  it('surfaces a failed load instead of showing an empty table', async () => {
    mockedList.mockRejectedValue(new Error('Failed to fetch'));

    renderOrganizations();

    expect(await screen.findByText('Could not load organizations')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    // The misleading empty state must not be shown when the request actually failed.
    expect(screen.queryByText('No organizations found')).not.toBeInTheDocument();
  });

  it('shows the empty state when InsForge returns no rows', async () => {
    mockedList.mockResolvedValue([]);

    renderOrganizations();

    expect(await screen.findByText('No organizations found')).toBeInTheDocument();
    expect(screen.queryByText('Could not load organizations')).not.toBeInTheDocument();
  });

  it('retries a failed load when the retry button is used', async () => {
    mockedList.mockRejectedValueOnce(new Error('Failed to fetch'));
    mockedList.mockResolvedValueOnce([
      { id: 'o1', name: 'Recovered Org', industry: '', website: '' },
    ] as any);

    renderOrganizations();

    const retry = await screen.findByRole('button', { name: 'Retry' });
    fireEvent.click(retry);

    expect(await screen.findByText('Recovered Org')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText('Could not load organizations')).not.toBeInTheDocument();
    });
  });

  it('keeps the modal open and reports the error when a create fails', async () => {
    mockedList.mockResolvedValue([]);
    vi.mocked(api.organizations.create).mockRejectedValue(new Error('permission denied for table'));

    renderOrganizations();

    fireEvent.click(await screen.findByRole('button', { name: '+ Add Organization' }));

    const nameInput = await screen.findByPlaceholderText('Name');
    fireEvent.change(nameInput, { target: { value: 'Broken Co' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('permission denied for table')).toBeInTheDocument();
    // The modal stays open so the user's input is not lost.
    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
  });
});

function renderPipeline() {
  return render(
    <MemoryRouter>
      <Pipeline />
    </MemoryRouter>,
  );
}

describe('Pipeline page', () => {
  const deals = [
    { id: 'd1', name: 'Acme Renewal', stage: 'new', value: 10000, organization_name: 'Acme Corporation' },
    { id: 'd2', name: 'Summit Rollout', stage: 'won', value: 25000, organization_name: 'Summit Healthcare' },
  ];

  it('groups deals into one column per stage', async () => {
    vi.mocked(api.deals.list).mockResolvedValue(deals as any);

    renderPipeline();

    expect(await screen.findByText('Acme Renewal')).toBeInTheDocument();
    expect(screen.getByText('Summit Rollout')).toBeInTheDocument();
    for (const label of ['New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('surfaces a failed load instead of an empty board', async () => {
    vi.mocked(api.deals.list).mockRejectedValue(new Error('Failed to fetch'));

    renderPipeline();

    expect(await screen.findByText('Could not load the pipeline')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
  });
});
