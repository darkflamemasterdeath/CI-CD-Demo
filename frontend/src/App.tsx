import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  createUser,
  deleteUser,
  fetchHello,
  fetchUsers,
  type HelloInfo,
  type User,
} from './api/users'
import { formatDateTime } from './utils/format'
import './App.css'

type Status = 'loading' | 'ready' | 'error'

export default function App() {
  const [hello, setHello] = useState<HelloInfo | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('开发者')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const [helloData, userList] = await Promise.all([fetchHello(), fetchUsers()])
      setHello(helloData)
      setUsers(userList)
      setStatus('ready')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      setError('名字不能为空')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await createUser({ name: name.trim(), email: email.trim(), role })
      setName('')
      setEmail('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: number) {
    setError(null)
    try {
      await deleteUser(id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div className="page">
      <header className="header">
        <h1>CI/CD 学习 Demo</h1>
        <p>React + TypeScript + Vite 前端 · Spring Boot 后端（内存假数据，无数据库）</p>
      </header>

      {hello && (
        <section className="card">
          <h2>后端状态</h2>
          <p>{hello.message}</p>
          <p>服务器时间：{formatDateTime(hello.time)}</p>
          <p>当前用户数：{hello.userCount}</p>
        </section>
      )}

      <section className="card">
        <h2>添加用户</h2>
        <form className="form" onSubmit={handleCreate}>
          <input
            placeholder="姓名"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option>管理员</option>
            <option>开发者</option>
            <option>测试</option>
            <option>访客</option>
          </select>
          <button type="submit" disabled={submitting}>
            {submitting ? '提交中…' : '添加'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>用户列表</h2>
        {status === 'loading' && <p>加载中…</p>}
        {status === 'error' && (
          <div className="error">
            <p>无法连接后端：{error}</p>
            <p>请确认已启动后端（cd backend &amp;&amp; mvn spring-boot:run）</p>
            <button onClick={() => void load()}>重试</button>
          </div>
        )}
        {status === 'ready' && (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>姓名</th>
                <th>邮箱</th>
                <th>角色</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <button className="link" onClick={() => void handleDelete(user.id)}>
                      删除
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5}>暂无数据</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>

      {error && status !== 'error' && <p className="error-text">{error}</p>}
    </div>
  )
}
