export type Persona = 'director' | 'ops' | 'player'

export interface DirectorSession {
  persona: 'director'
  baseUrl: string
  token: string
  callsign: string
  scenarioId: number
}

export interface OpsSession {
  persona: 'ops'
  baseUrl: string
  token: string
  callsign: string
  actor?: any
}

export interface PlayerSession {
  persona: 'player'
  baseUrl: string
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

export async function directorLogin(baseUrl: string, callsign: string, password: string, scenarioId: number): Promise<DirectorSession> {
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
  return { persona: 'director', baseUrl, token, callsign, scenarioId }
}

export async function opsJoin(baseUrl: string, joinCode: string, callsign: string): Promise<OpsSession> {
  const res = await fetch(`${baseUrl}/api/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: joinCode, callsign }),
  })
  if (!res.ok) {
    const d = await res.json().catch(() => ({} as any))
    throw new Error(d.message || `Ops join failed (${res.status})`)
  }
  const d = await res.json() as any
  const token = d.token
  if (!token) throw new Error('Ops join did not return a token')
  return { persona: 'ops', baseUrl, token, callsign, actor: d.actor }
}
