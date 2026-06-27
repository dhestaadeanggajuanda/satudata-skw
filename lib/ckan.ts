// Minimal server-side CKAN client — plain fetch, no dependency, no React coupling.
// Used ONLY in getStaticProps/getStaticPaths, so it never reaches the browser bundle.

// CKAN base URL used to FETCH the API (getStaticProps). May be an internal LAN
// IP at build time for speed/reliability. Override with the DMS env var.
export const DMS = (process.env.DMS || 'https://data.singkawangkota.go.id').replace(/\/+$/, '')

// PUBLIC CKAN base URL — the host that browser-facing URLs (resource downloads,
// uploads, images) must point to. Kept separate from DMS so the build can fetch
// via an internal host while still rendering public URLs. Override via env.
export const CKAN_PUBLIC = (process.env.CKAN_PUBLIC_URL || 'https://data.singkawangkota.go.id').replace(/\/+$/, '')

// Hosts whose URLs must be re-based onto CKAN_PUBLIC: the fetch host (DMS, which
// CKAN may echo into URLs when its site_url isn't authoritative — e.g. an internal
// IP), the portal domain (stale Solr snapshots), and the internal IP. Override via
// env (comma-separated).
const dmsHost = (() => { try { return new URL(DMS).host } catch { return '' } })()
const REWRITE_HOSTS = new Set([
  dmsHost,
  ...(process.env.CKAN_REWRITE_HOSTS ||
      'satudata.singkawangkota.go.id,172.16.20.229:5000,172.16.20.229')
    .split(',').map((s) => s.trim()).filter(Boolean),
])

// Normalize a CKAN-emitted URL (resource download, upload, image). Relative URLs
// and absolute URLs whose host is the public host or in REWRITE_HOSTS are re-based
// onto CKAN_PUBLIC; genuinely external resource links are left untouched.
export function ckanUrl(raw: string | null | undefined): string {
  if (!raw) return ''
  try {
    const u = new URL(raw, CKAN_PUBLIC) // handles both relative and absolute
    const pubHost = new URL(CKAN_PUBLIC).host
    if (u.host === pubHost || REWRITE_HOSTS.has(u.host)) {
      return `${CKAN_PUBLIC}${u.pathname}${u.search}`
    }
    return u.href // external link — leave as-is
  } catch {
    return raw
  }
}

// ISR revalidate interval (seconds) for all getStaticProps. Pages regenerate
// server-side at most once per interval, so new CKAN datasets appear without a
// rebuild. Override via env REVALIDATE_SECONDS. Default 5 minutes.
export const REVALIDATE = Number(process.env.REVALIDATE_SECONDS) || 300

// Filters baked in by /portaljs-connect-ckan. Empty array = no filter.
export const ORG_FILTER: string[] = []
export const GROUP_FILTER: string[] = []

// Max datasets to pre-render at build time (SSG). Raise for larger catalogs;
// note every dataset becomes one statically generated page.
export const MAX_DATASETS = 400

// CKAN REST shapes — only the fields the pages read.
type CkanResource = { id: string; name?: string; format?: string; url?: string; description?: string }
type CkanOrganization = { name?: string; title?: string }
export type CkanTag = { display_name: string; name: string }
export type CkanExtra = { key: string; value: string }
export type CkanPackage = {
  name: string
  id?: string
  title?: string
  notes?: string
  organization?: CkanOrganization
  resources?: CkanResource[]
  tags?: CkanTag[]
  extras?: CkanExtra[]
  groups?: { name: string; title: string; image_display_url?: string; package_count?: number }[]
  license_title?: string
  license_url?: string
  metadata_created?: string
  metadata_modified?: string
  isopen?: boolean
  author?: string
  maintainer?: string
  num_resources?: number
}

export type CkanOrgDetail = {
  name: string
  title: string
  description: string
  image_display_url: string
  package_count: number
  created: string
}

export type CkanOrgCard = {
  name: string
  title: string
  description: string
  imageUrl: string
  packageCount: number
}

export type CkanGroupCard = {
  name: string
  title: string
  description: string
  imageUrl: string
  packageCount: number
}

export type CkanActivity = {
  timestamp: string
  activity_type: string
  data?: { package?: { title?: string } }
}

export type CkanBlogPost = {
  name: string
  title: string
  publish_date: string | null
  image: string | null
  private: boolean
}

export type SearchArgs = {
  offset?: number
  limit?: number
  tags?: string[]
  orgs?: string[]
  groups?: string[]
}

function buildFq({ orgs = [], groups = [], tags = [] }: SearchArgs): string {
  const clause = (field: string, vals: string[]) =>
    vals.length ? `${field}:(${vals.map((v) => `"${v}"`).join(' OR ')})` : ''
  return [clause('organization', orgs), clause('groups', groups), clause('tags', tags)]
    .filter(Boolean)
    .join(' ')
}

async function ckanAction(action: string, params: Record<string, string>): Promise<any> {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${DMS}/api/3/action/${action}?${qs}`)
  if (!res.ok) throw new Error(`CKAN ${action} failed: ${res.status} ${res.statusText}`)
  const body = await res.json()
  if (!body?.success) throw new Error(`CKAN ${action} returned success=false`)
  return body.result
}

export const ckan = {
  async packageSearch(
    args: SearchArgs = {}
  ): Promise<{ datasets: CkanPackage[]; count: number }> {
    const params: Record<string, string> = {
      start: String(args.offset ?? 0),
      rows: String(args.limit ?? MAX_DATASETS),
    }
    const fq = buildFq(args)
    if (fq) params.fq = fq
    const result = await ckanAction('package_search', params)
    return { datasets: result.results ?? [], count: result.count ?? 0 }
  },
  async getDatasetDetails(slug: string): Promise<CkanPackage> {
    return ckanAction('package_show', { id: slug })
  },
  async organizationList(): Promise<{ name: string; title: string }[]> {
    const result = await ckanAction('organization_list', { all_fields: 'true', limit: '50' })
    return (result as any[]).map((o: any) => ({ name: o.name, title: o.title || o.name }))
  },
  async organizationListFull(): Promise<CkanOrgCard[]> {
    const result = await ckanAction('organization_list', { all_fields: 'true', limit: '100' })
    return (result as any[]).map((o: any) => ({
      name: o.name,
      title: o.title || o.name,
      description: o.description || '',
      imageUrl: ckanUrl(o.image_display_url),
      packageCount: o.package_count ?? 0,
    }))
  },
  async groupList(): Promise<CkanGroupCard[]> {
    const result = await ckanAction('group_list', { all_fields: 'true', limit: '100' })
    return (result as any[]).map((g: any) => ({
      name: g.name,
      title: g.title || g.name,
      description: g.description || '',
      imageUrl: ckanUrl(g.image_display_url),
      packageCount: g.package_count ?? 0,
    }))
  },
  async getGroupDetails(slug: string): Promise<CkanGroupCard | null> {
    try {
      const g = await ckanAction('group_show', { id: slug, include_datasets: 'false' })
      return {
        name: g.name,
        title: g.title || g.name,
        description: g.description || '',
        imageUrl: ckanUrl(g.image_display_url),
        packageCount: g.package_count ?? 0,
      }
    } catch { return null }
  },
  async getOrganizationDetails(slug: string): Promise<CkanOrgDetail | null> {
    try {
      return await ckanAction('organization_show', { id: slug, include_datasets: 'false' })
    } catch { return null }
  },
  async getDatasetActivity(datasetId: string): Promise<CkanActivity[]> {
    try {
      return await ckanAction('package_activity_list', { id: datasetId, limit: '15' })
    } catch { return [] }
  },
  async tagList(): Promise<string[]> {
    try {
      const result = await ckanAction('tag_list', {})
      return (result as string[]).slice(0, 12)
    } catch { return [] }
  },
  async blogList(limit = 20): Promise<CkanBlogPost[]> {
    try {
      const result = await ckanAction('ckanext_pages_list', {
        page_type: 'blog',
        private: 'false',
        order_publish_date: 'true',
      })
      return (result as CkanBlogPost[])
        .filter((p) => !p.private)
        .slice(0, limit)
        .map((p) => ({ ...p, image: p.image ? ckanUrl(p.image) : null }))
    } catch { return [] }
  },
}

export type DatasetCard = {
  slug: string
  namespace: string
  name: string
  description?: string
  groups: string[]
}

// Canonical showcase URL — keeps the template's /@<namespace>/<slug> structure.
export function datasetHref(d: { namespace: string; slug: string }): string {
  return `/@${d.namespace}/${d.slug}`
}
