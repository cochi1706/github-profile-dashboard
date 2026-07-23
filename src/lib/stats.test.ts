import { describe, expect, it } from 'vitest'
import { getRepositoryLanguageRows, sortRepositories } from './stats'
import type { RepositoryStat } from '../types'

const repositories: RepositoryStat[] = [
  {
    name: 'alpha',
    fullName: 'demo/alpha',
    description: null,
    htmlUrl: 'https://github.com/demo/alpha',
    primaryLanguage: 'TypeScript',
    languages: { TypeScript: 80, CSS: 20 },
    stars: 3,
    forks: 1,
    openIssues: 0,
    sizeKb: 10,
    isFork: false,
    archived: false,
    license: null,
    updatedAt: '2026-01-01T00:00:00Z',
    topics: [],
  },
  {
    name: 'beta',
    fullName: 'demo/beta',
    description: null,
    htmlUrl: 'https://github.com/demo/beta',
    primaryLanguage: 'Python',
    languages: { Python: 100 },
    stars: 10,
    forks: 0,
    openIssues: 2,
    sizeKb: 20,
    isFork: false,
    archived: false,
    license: null,
    updatedAt: '2026-02-01T00:00:00Z',
    topics: [],
  },
]

describe('repository statistics helpers', () => {
  it('sorts numeric columns descending', () => {
    expect(sortRepositories(repositories, 'stars').map((repo) => repo.name)).toEqual(['beta', 'alpha'])
  })

  it('sorts dates from newest to oldest', () => {
    expect(sortRepositories(repositories, 'updatedAt').map((repo) => repo.name)).toEqual(['beta', 'alpha'])
  })

  it('turns repository language bytes into percentages', () => {
    expect(getRepositoryLanguageRows(repositories[0])).toEqual([
      { name: 'TypeScript', percentage: 80 },
      { name: 'CSS', percentage: 20 },
    ])
  })
})
