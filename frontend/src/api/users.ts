export interface User {
  id: number
  name: string
  email: string
  role: string
}

export interface UserInput {
  name: string
  email: string
  role: string
}

export interface HelloInfo {
  message: string
  time: string
  userCount: number
}

const BASE_URL = '/api'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`请求失败 ${res.status}: ${text || res.statusText}`)
  }
  if (res.status === 204) {
    return undefined as T
  }
  return (await res.json()) as T
}

export function fetchHello(): Promise<HelloInfo> {
  return request<HelloInfo>('/hello')
}

export function fetchUsers(): Promise<User[]> {
  return request<User[]>('/users')
}

export function createUser(input: UserInput): Promise<User> {
  return request<User>('/users', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function deleteUser(id: number): Promise<void> {
  return request<void>(`/users/${id}`, { method: 'DELETE' })
}
