export type DataSource = 'github-api' | 'sample'

export interface GithubUser {
  login: string
  name: string | null
  avatarUrl: string
  htmlUrl: string
  bio: string | null
  followers: number
  following: number
  publicRepos: number
}

export interface LanguageStat {
  name: string
  bytes: number
  percentage: number
  repositories: number
  color: string
}

export interface RepositoryStat {
  name: string
  fullName: string
  description: string | null
  htmlUrl: string
  primaryLanguage: string | null
  languages: Record<string, number>
  stars: number
  forks: number
  openIssues: number
  sizeKb: number
  isFork: boolean
  archived: boolean
  license: string | null
  updatedAt: string
  topics: string[]
}

export interface GithubStats {
  schemaVersion: 1
  generatedAt: string
  source: DataSource
  user: GithubUser
  totals: {
    repositories: number
    originalRepositories: number
    stars: number
    forks: number
    openIssues: number
    sizeKb: number
  }
  languages: LanguageStat[]
  repositories: RepositoryStat[]
}

export type RepositorySortKey = 'updatedAt' | 'stars' | 'forks' | 'name'
