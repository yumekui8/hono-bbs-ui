type Role = 'owner' | 'group' | 'auth' | 'anon'
type Action = 'GET' | 'POST' | 'PUT' | 'DELETE'

const ACTION_BIT: Record<Action, number> = {
  GET: 8,
  POST: 4,
  PUT: 2,
  DELETE: 1,
}

const ROLE_INDEX: Record<Role, number> = {
  owner: 0,
  group: 1,
  auth: 2,
  anon: 3,
}

export function canDo(permissions: string, role: Role, action: Action): boolean {
  const parts = permissions.split(',').map(Number)
  const mask = parts[ROLE_INDEX[role]] ?? 0
  return (mask & ACTION_BIT[action]) !== 0
}

export function parsePermissions(permissions: string) {
  const parts = permissions.split(',').map(Number)
  return {
    owner: parts[0] ?? 0,
    group: parts[1] ?? 0,
    auth: parts[2] ?? 0,
    anon: parts[3] ?? 0,
  }
}
