export type Persona = 'director' | 'ops' | 'player'

export interface DirectorSession {
  persona: 'director'
  /** API origin, e.g. https://flapsandseals.com */
  baseUrl: string
  /** Human-facing portal URL, e.g. https://flapsandseals.com/m */
  portalUrl?: string
  token: string
  callsign: string
  scenarioId: number
}

export interface OpsSession {
  persona: 'ops'
  baseUrl: string
  portalUrl?: string
  /** Actor auth token (for /api/ops/*). */
  token: string
  callsign: string
  actor?: any
  /** User session token (for account-level identity). */
  userSessionToken: string
  username: string
}

export interface PlayerSession {
  persona: 'player'
  baseUrl: string
  portalUrl?: string
  token?: string
  playerId?: string
}

export type EySession = DirectorSession | OpsSession | PlayerSession

const KEY = 'ey.session'

export function loadSession(): EySession | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const s = JSON.parse(raw)
    if (!s || !s.persona || !s.baseUrl) return null
    return s as EySession
  } catch {
    return null
  }
}

export function saveSession(session: EySession): void {
  localStorage.setItem(KEY, JSON.stringify(session))
}

export function clearSession(): void {
  localStorage.removeItem(KEY)
}

export function normalizeBaseUrl(url: string): string {
  url = String(url || '').trim()
  if (!url) return ''

  // Allow bare hostnames like flapsandseals.com
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url
  }

  url = url.replace(/\/$/, '')
  return url
}

export function apiBaseFromPortalUrl(portalUrl: string): string {
  const u = new URL(normalizeBaseUrl(portalUrl))
  return u.origin
}

export function portalUrlFromBase(baseUrl: string, persona: Persona): string {
  const origin = apiBaseFromPortalUrl(baseUrl)
  if (persona === 'director') return origin + '/m'
  if (persona === 'ops') return origin + '/ops'
  return origin
}

export async function directorLogin(portalUrl: string, callsign: string, password: string, scenarioId: number): Promise<DirectorSession> {
  const baseUrl = apiBaseFromPortalUrl(portalUrl)
  const res = await fetch(`${baseUrl}/api/m/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callsign, password, scenario_id: scenarioId }),
  })
  if (!res.ok) {
    const d = await res.json().catch(() => ({} as any))
    throw new Error(d.message || `Director login failed (${res.status})`)
  }
  const d = await res.json() as any
  const token = d.token || d.access_token || d.session?.token
  if (!token) throw new Error('Director login did not return a token')
  return { persona: 'director', baseUrl, portalUrl, token, callsign, scenarioId }
}

export async function userLogin(portalUrl: string, username: string): Promise<{ baseUrl: string; username: string; userSessionToken: string; callsign: string }> {
  const baseUrl = apiBaseFromPortalUrl(portalUrl)
  const res = await fetch(`${baseUrl}/api/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  })
  if (!res.ok) {
    const d = await res.json().catch(() => ({} as any))
    throw new Error(d.message || `User login failed (${res.status})`)
  }
  const d = await res.json() as any
  const userSessionToken = d.session_token
  const callsign = d.user?.callsign
  if (!userSessionToken) throw new Error('User login did not return session_token')
  if (!callsign) throw new Error('User login did not return user.callsign')
  return { baseUrl, username, userSessionToken, callsign }
}

export async function opsJoin(portalUrl: string, joinCode: string, userSessionToken: string, username: string): Promise<OpsSession> {
  const baseUrl = apiBaseFromPortalUrl(portalUrl)
  const res = await fetch(`${baseUrl}/api/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userSessionToken}`,
    },
    body: JSON.stringify({ code: joinCode }),
  })
  const d = await res.json().catch(() => ({} as any)) as any
  if (!res.ok) {
    throw new Error(d.message || `Ops join failed (${res.status})`)
  }
  const token = d.token
  if (!token) throw new Error('Ops join did not return a token')
  const callsign = d.actor?.callsign || d.actor?.callsign || ''
  if (!callsign) throw new Error('Ops join did not return actor.callsign')
  return { persona: 'ops', baseUrl, portalUrl, token, callsign, actor: d.actor, userSessionToken, username }
}
