import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ArrowUpRight,
  BookOpen,
  Code2,
  ExternalLink,
  GitFork,
  Github,
  RefreshCw,
  Search,
  Star,
  Users,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import rawStats from './data/github-stats.json'
import {
  formatBytes,
  formatCompactNumber,
  formatDate,
  getLanguageChartTotal,
  getLanguageDistribution,
  getRepositoryLanguageRows,
  sortRepositories,
} from './lib/stats'
import type { GithubStats, RepositorySortKey } from './types'

const stats = rawStats as GithubStats
const languageColors = Object.fromEntries(stats.languages.map((language) => [language.name, language.color]))
const chartTooltipStyle = {
  backgroundColor: '#142139',
  border: '1px solid #29415f',
  borderRadius: 12,
  color: '#f4f7fb',
}

function App() {
  const [query, setQuery] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('All')
  const [sortKey, setSortKey] = useState<RepositorySortKey>('updatedAt')

  const chartLanguages = useMemo(() => getLanguageDistribution(stats.languages), [])
  const totalLanguageBytes = useMemo(() => getLanguageChartTotal(stats.languages), [])
  const languageBarData = useMemo(
    () => stats.languages.slice(0, 8).map((language) => ({ ...language, label: `${language.percentage}%` })),
    [],
  )
  const visibleRepositories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const matchingRepositories = stats.repositories.filter((repository) => {
      const matchesQuery =
        !normalizedQuery ||
        [repository.name, repository.description ?? '', repository.primaryLanguage ?? '', ...repository.topics]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)
      const matchesLanguage =
        selectedLanguage === 'All' || Object.prototype.hasOwnProperty.call(repository.languages, selectedLanguage)
      return matchesQuery && matchesLanguage
    })

    return sortRepositories(matchingRepositories, sortKey)
  }, [query, selectedLanguage, sortKey])

  const resetFilters = () => {
    setQuery('')
    setSelectedLanguage('All')
    setSortKey('updatedAt')
  }

  return (
    <main className="app-shell">
      <div className="background-glow background-glow-one" />
      <div className="background-glow background-glow-two" />

      <section className="content-wrap">
        <header className="topbar">
          <a className="brand" href={stats.user.htmlUrl} target="_blank" rel="noreferrer">
            <span className="brand-mark"><Github size={19} /></span>
            <span>profile<span className="brand-accent">/</span>dashboard</span>
          </a>
          <div className="snapshot-meta">
            <span className={`status-dot ${stats.source === 'github-api' ? 'is-live' : ''}`} />
            {stats.source === 'github-api' ? 'Live snapshot' : 'Sample snapshot'}
            <span className="meta-divider">·</span>
            Updated {formatDate(stats.generatedAt)}
          </div>
        </header>

        <section className="hero-section">
          <div className="profile-block">
            <div className="avatar-frame">
              <img src={stats.user.avatarUrl} alt={`${stats.user.login} avatar`} />
            </div>
            <div className="profile-copy">
              <p className="eyebrow">GitHub profile overview</p>
              <h1>{stats.user.name || stats.user.login}</h1>
              <a className="profile-handle" href={stats.user.htmlUrl} target="_blank" rel="noreferrer">
                @{stats.user.login} <ArrowUpRight size={15} />
              </a>
              <p className="profile-bio">{stats.user.bio || 'No profile bio available.'}</p>
            </div>
          </div>
          <div className="hero-actions">
            <a className="outline-button" href={stats.user.htmlUrl} target="_blank" rel="noreferrer">
              View GitHub <ExternalLink size={16} />
            </a>
            <span className="generated-note"><RefreshCw size={14} /> Auto-refresh via Actions</span>
          </div>
        </section>

        {stats.source === 'sample' && (
          <div className="sample-banner">
            <span className="banner-icon"><Code2 size={17} /></span>
            <span><strong>Sample data đang hiển thị.</strong> Đặt <code>GITHUB_USERNAME</code> trong Secrets rồi chạy workflow; <code>GITHUB_TOKEN</code> được GitHub cấp tự động.</span>
          </div>
        )}

        <section className="kpi-grid" aria-label="Profile summary">
          <KpiCard icon={<BookOpen size={20} />} label="Repositories" value={formatCompactNumber(stats.totals.repositories)} detail={`${stats.totals.originalRepositories} original`} tone="purple" />
          <KpiCard icon={<Star size={20} />} label="Total stars" value={formatCompactNumber(stats.totals.stars)} detail="Across all repos" tone="yellow" />
          <KpiCard icon={<GitFork size={20} />} label="Total forks" value={formatCompactNumber(stats.totals.forks)} detail="Community reach" tone="blue" />
          <KpiCard icon={<Users size={20} />} label="Followers" value={formatCompactNumber(stats.user.followers)} detail={`${formatCompactNumber(stats.user.following)} following`} tone="green" />
        </section>

        <section className="dashboard-grid">
          <article className="panel language-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Code composition</p>
                <h2>Programming languages</h2>
              </div>
              <span className="panel-caption">By bytes of code</span>
            </div>
            <div className="language-chart-layout">
              <div className="donut-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartLanguages} dataKey="bytes" nameKey="name" innerRadius={78} outerRadius={116} paddingAngle={3} stroke="none">
                      {chartLanguages.map((language) => <Cell key={language.name} fill={language.color} />)}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => formatBytes(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-center">
                  <strong>{formatBytes(totalLanguageBytes)}</strong>
                  <span>total code</span>
                </div>
              </div>
              <div className="language-legend">
                {chartLanguages.map((language) => (
                  <button className="language-item" key={language.name} onClick={() => setSelectedLanguage(language.name)} type="button">
                    <span className="language-name"><span className="color-swatch" style={{ backgroundColor: language.color }} />{language.name}</span>
                    <span className="language-value"><strong>{language.percentage}%</strong><small>{language.repositories} repos</small></span>
                  </button>
                ))}
              </div>
            </div>
          </article>

          <article className="panel activity-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Repository footprint</p>
                <h2>Language presence</h2>
              </div>
              <span className="panel-caption">Repos using each language</span>
            </div>
            <div className="bar-chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={languageBarData} layout="vertical" margin={{ top: 4, right: 20, left: 8, bottom: 4 }}>
                  <CartesianGrid horizontal={false} stroke="#20334e" />
                  <XAxis type="number" hide domain={[0, 'dataMax']} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={82} tick={{ fill: '#9baecc', fontSize: 12 }} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [`${value} repos`, 'Used in']} cursor={{ fill: 'rgba(108, 127, 255, 0.08)' }} />
                  <Bar dataKey="repositories" radius={[0, 6, 6, 0]} barSize={16}>
                    {languageBarData.map((language) => <Cell key={language.name} fill={languageColors[language.name] ?? '#6d7cff'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="activity-footer"><span><span className="pulse-dot" /> {stats.totals.openIssues} open issues</span><span>{formatBytes(stats.totals.sizeKb * 1024)} repository size</span></div>
          </article>
        </section>

        <section className="repositories-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Explore the work</p>
              <h2>Repositories <span>{visibleRepositories.length}</span></h2>
            </div>
            <div className="filters" role="search">
              <label className="search-field"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search repositories" aria-label="Search repositories" /></label>
              <select value={sortKey} onChange={(event) => setSortKey(event.target.value as RepositorySortKey)} aria-label="Sort repositories">
                <option value="updatedAt">Recently updated</option>
                <option value="stars">Most stars</option>
                <option value="forks">Most forks</option>
                <option value="name">Name A–Z</option>
              </select>
              {selectedLanguage !== 'All' && <button className="filter-chip" type="button" onClick={() => setSelectedLanguage('All')}>{selectedLanguage} ×</button>}
            </div>
          </div>

          <div className="repo-table-wrap">
            {visibleRepositories.length > 0 ? (
              <table className="repo-table">
                <thead><tr><th>Repository</th><th>Primary language</th><th>Stars</th><th>Forks</th><th>Updated</th><th aria-label="Open repository" /></tr></thead>
                <tbody>
                  {visibleRepositories.map((repository) => <RepositoryRow key={repository.fullName} repository={repository} />)}
                </tbody>
              </table>
            ) : (
              <div className="empty-state"><Search size={22} /><strong>No repositories found</strong><span>Try a different search or reset the language filter.</span><button className="outline-button" onClick={resetFilters} type="button">Reset filters</button></div>
            )}
          </div>
        </section>

        <footer className="footer"><span>Built with React, Recharts & GitHub API</span><span>Public metadata only · No token shipped to the client</span></footer>
      </section>
    </main>
  )
}

function KpiCard({ icon, label, value, detail, tone }: { icon: ReactNode; label: string; value: string; detail: string; tone: string }) {
  return <div className="kpi-card"><div className={`kpi-icon ${tone}`}>{icon}</div><div><span className="kpi-label">{label}</span><strong className="kpi-value">{value}</strong><span className="kpi-detail">{detail}</span></div></div>
}

function RepositoryRow({ repository }: { repository: GithubStats['repositories'][number] }) {
  const languages = getRepositoryLanguageRows(repository).slice(0, 3)
  return <tr>
    <td><div className="repo-name-cell"><div className="repo-title-line"><a href={repository.htmlUrl} target="_blank" rel="noreferrer">{repository.name}</a>{repository.archived && <span className="archived-label">Archived</span>}</div><span className="repo-description">{repository.description || 'No description provided.'}</span>{repository.topics.length > 0 && <div className="topic-row">{repository.topics.slice(0, 3).map((topic) => <span key={topic}>{topic}</span>)}</div>}</div></td>
    <td><div className="repo-language-cell">{repository.primaryLanguage && <span className="color-swatch" style={{ backgroundColor: languageColors[repository.primaryLanguage] ?? '#8692a6' }} />}{repository.primaryLanguage || '—'}{languages.length > 1 && <span className="language-more">+{languages.length - 1}</span>}</div></td>
    <td><span className="metric-cell"><Star size={14} />{formatCompactNumber(repository.stars)}</span></td>
    <td><span className="metric-cell"><GitFork size={14} />{formatCompactNumber(repository.forks)}</span></td>
    <td><span className="date-cell">{formatDate(repository.updatedAt)}</span></td>
    <td><a className="row-link" href={repository.htmlUrl} target="_blank" rel="noreferrer" aria-label={`Open ${repository.name}`}><ArrowUpRight size={17} /></a></td>
  </tr>
}

export default App
