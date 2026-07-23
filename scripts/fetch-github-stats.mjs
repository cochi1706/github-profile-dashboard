#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const username = process.env.GH_USERNAME?.trim()
const token = process.env.GH_TOKEN?.trim()

if (!username) {
  throw new Error('Missing GH_USERNAME. Set it in .env locally or GitHub Actions Secrets.')
}

if (!token) {
  throw new Error('Missing GH_TOKEN. The token is required for authenticated GitHub API requests.')
}

const apiBase = 'https://api.github.com'
const headers = {
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token}`,
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'github-profile-dashboard',
}

async function github(path) {
  const response = await fetch(`${apiBase}${path}`, { headers })
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`GitHub API ${response.status} for ${path}: ${detail.slice(0, 240)}`)
  }
  return response.json()
}

async function mapWithConcurrency(items, concurrency, callback) {
  const results = new Array(items.length)
  let cursor = 0

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await callback(items[index], index)
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker))
  return results
}

const getAllRepositories = async () => {
  const repositories = []
  for (let page = 1; ; page += 1) {
    const batch = await github(`/users/${encodeURIComponent(username)}/repos?type=owner&sort=updated&per_page=100&page=${page}`)
    repositories.push(...batch)
    if (batch.length < 100) return repositories
  }
}

const user = await github(`/users/${encodeURIComponent(username)}`)
const repositories = await getAllRepositories()
const languagePayloads = await mapWithConcurrency(repositories, 6, async (repository) => {
  const languages = await github(`/repos/${repository.full_name}/languages`)
  return [repository.full_name, languages]
})
const languagesByRepository = Object.fromEntries(languagePayloads)

const languageTotals = new Map()
for (const repository of repositories) {
  for (const [language, bytes] of Object.entries(languagesByRepository[repository.full_name] ?? {})) {
    const current = languageTotals.get(language) ?? { bytes: 0, repositories: 0 }
    current.bytes += bytes
    current.repositories += 1
    languageTotals.set(language, current)
  }
}

const languageColors = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  CSS: '#563d7c',
  HTML: '#e34c26',
  Shell: '#89e051',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Vue: '#41b883',
}

const totalLanguageBytes = [...languageTotals.values()].reduce((sum, item) => sum + item.bytes, 0)
const languageStats = [...languageTotals.entries()]
  .map(([name, data]) => ({
    name,
    bytes: data.bytes,
    percentage: totalLanguageBytes ? Number(((data.bytes / totalLanguageBytes) * 100).toFixed(1)) : 0,
    repositories: data.repositories,
    color: languageColors[name] ?? '#8290a7',
  }))
  .sort((a, b) => b.bytes - a.bytes)

const repositoryStats = repositories
  .map((repository) => ({
    name: repository.name,
    fullName: repository.full_name,
    description: repository.description,
    htmlUrl: repository.html_url,
    primaryLanguage: repository.language,
    languages: languagesByRepository[repository.full_name] ?? {},
    stars: repository.stargazers_count,
    forks: repository.forks_count,
    openIssues: repository.open_issues_count,
    sizeKb: repository.size,
    isFork: repository.fork,
    archived: repository.archived,
    license: repository.license?.spdx_id ?? null,
    updatedAt: repository.updated_at,
    topics: repository.topics ?? [],
  }))
  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

const output = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: 'github-api',
  user: {
    login: user.login,
    name: user.name,
    avatarUrl: user.avatar_url,
    htmlUrl: user.html_url,
    bio: user.bio,
    followers: user.followers,
    following: user.following,
    publicRepos: user.public_repos,
  },
  totals: {
    repositories: repositoryStats.length,
    originalRepositories: repositoryStats.filter((repository) => !repository.isFork).length,
    stars: repositoryStats.reduce((sum, repository) => sum + repository.stars, 0),
    forks: repositoryStats.reduce((sum, repository) => sum + repository.forks, 0),
    openIssues: repositoryStats.reduce((sum, repository) => sum + repository.openIssues, 0),
    sizeKb: repositoryStats.reduce((sum, repository) => sum + repository.sizeKb, 0),
  },
  languages: languageStats,
  repositories: repositoryStats,
}

const outputPath = resolve(process.cwd(), 'src/data/github-stats.json')
await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8')

console.log(`Wrote ${repositoryStats.length} public repositories and ${languageStats.length} languages to ${outputPath}`)
