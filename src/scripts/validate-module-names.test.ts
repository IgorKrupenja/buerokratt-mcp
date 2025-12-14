import { describe, expect, it, spyOn } from 'bun:test';

import * as loaderModule from '../rules/loader.ts';

// Mock the fetch function
const mockFetch = spyOn(global, 'fetch');

describe('validate-module-names', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('validates module names against GitHub repositories', async () => {
    // Mock loadAllRules to return test data
    const mockRules = [
      {
        path: 'rules/service-module/rules.md',
        frontmatter: {
          modules: ['Service-Module', 'global'],
        },
        content: 'Test content',
        raw: 'Test raw',
      },
      {
        path: 'rules/training-module/rules.md',
        frontmatter: {
          modules: ['Training-Module'],
        },
        content: 'Test content',
        raw: 'Test raw',
      },
    ];

    spyOn(loaderModule, 'loadAllRules').mockResolvedValue(mockRules as any);

    // Mock GitHub API response
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => [
        { name: 'Service-Module', full_name: 'buerokratt/Service-Module' },
        { name: 'Training-Module', full_name: 'buerokratt/Training-Module' },
        { name: 'Analytics-Module', full_name: 'buerokratt/Analytics-Module' },
      ],
    } as Response);

    // Import and run the validation
    const { fetchGitHubRepositories, extractModuleNames } = await import('./validate-module-names.ts');

    const moduleNames = await extractModuleNames();
    const repositories = await fetchGitHubRepositories('buerokratt');

    expect(moduleNames.has('Service-Module')).toBe(true);
    expect(moduleNames.has('Training-Module')).toBe(true);
    expect(moduleNames.has('global')).toBe(true);
    expect(repositories).toContain('Service-Module');
    expect(repositories).toContain('Training-Module');
  });

  it('handles GitHub API errors gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: new Headers(),
    } as Response);

    const { fetchGitHubRepositories } = await import('./validate-module-names.ts');

    await expect(fetchGitHubRepositories('nonexistent-org')).rejects.toThrow('Organization "nonexistent-org" not found');
  });

  it('handles rate limit errors', async () => {
    const headers = new Headers();
    headers.set('x-ratelimit-remaining', '0');

    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      headers,
    } as Response);

    const { fetchGitHubRepositories } = await import('./validate-module-names.ts');

    await expect(fetchGitHubRepositories('buerokratt')).rejects.toThrow('GitHub API rate limit exceeded');
  });
});
