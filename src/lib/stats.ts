import type { LanguageStat, RepositorySortKey, RepositoryStat } from '../types'

export const formatCompactNumber = (value: number): string =>
  new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`
}

export const formatDate = (value: string): string =>
  new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(value),
  )

export const getLanguageDistribution = (languages: LanguageStat[], limit = 6): LanguageStat[] =>
  [...languages].sort((a, b) => b.bytes - a.bytes).slice(0, limit)

export const sortRepositories = (
  repositories: RepositoryStat[],
  sortKey: RepositorySortKey,
): RepositoryStat[] =>
  [...repositories].sort((a, b) => {
    if (sortKey === 'name') return a.name.localeCompare(b.name)
    if (sortKey === 'updatedAt') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    return b[sortKey] - a[sortKey]
  })

export const getRepositoryLanguageRows = (
  repository: RepositoryStat,
): Array<{ name: string; percentage: number }> => {
  const total = Object.values(repository.languages).reduce((sum, bytes) => sum + bytes, 0)
  if (!total) return []

  return Object.entries(repository.languages)
    .map(([name, bytes]) => ({ name, percentage: Math.round((bytes / total) * 100) }))
    .sort((a, b) => b.percentage - a.percentage)
}

export const getLanguageChartTotal = (languages: LanguageStat[]): number =>
  languages.reduce((sum, language) => sum + language.bytes, 0)
