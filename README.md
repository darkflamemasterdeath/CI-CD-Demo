# CI/CD 学习 Demo（前后端分离，可运行 / 可打包）

一个最小可运行的前后端项目，专门用来练习 CI/CD：

- **前端**：React 18 + TypeScript + Vite 5（`frontend/`）
- **后端**：Spring Boot 3（`backend/`），接口数据放在**内存 Map** 里（相当于进程内缓存），
  **不连数据库**，重启即恢复预置假数据
- 前端通过 **Vite 代理**把 `/api` 转发给后端（后端也配了 CORS 兜底）

## 目录结构

```
cicd/
├── .github/workflows/ci.yml   # GitHub Actions 流水线示例（前后端两个 job）
├── backend/                   # Spring Boot 后端
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/example/demo/
│       │   ├── controller/    # 接口：UserController / SystemController
│       │   ├── service/       # 内存数据服务 UserService
│       │   ├── model/         # User / UserRequest
│       │   ├── config/        # CORS 配置
│       │   └── web/           # 统一异常处理
│       └── test/java/         # 单元测试（mvn test 跑）
└── frontend/                  # React + TS + Vite 前端
    ├── src/App.tsx            # 页面：后端状态 + 用户增删查
    ├── src/api/users.ts       # 接口封装（fetch）
    └── src/utils/format.test.ts  # 单元测试（vitest）
```

## 环境要求

| 工具 | 版本 | 说明 |
| --- | --- | --- |
| JDK | 17+ | 你机器上的 JDK 25 可以直接用 |
| Maven | 3.9+ | 或直接用项目自带的 `mvnw.cmd`（已生成 Maven Wrapper） |
| Node.js | 18+ | 你机器上的 Node 24 可以直接用 |

## 1. 启动后端（端口 8080）

```bash
cd backend

# Windows
mvnw.cmd spring-boot:run
# 或者（已装 Maven 时）
mvn spring-boot:run
```

验证接口：

```bash
curl http://localhost:8080/api/hello
curl http://localhost:8080/api/users
```

## 2. 启动前端（端口 5173，需要后端先启动）

```bash
cd frontend
npm install
npm run dev
```

浏览器打开 <http://localhost:5173> ，应该能看到：
"后端状态"卡片（来自 Spring Boot）+ 预置的 3 个用户，可以增删用户。

## 3. 打包（练习 CI 里的"构建产物"环节）

```bash
# 后端 → target/cicd-demo-backend-1.0.0.jar
cd backend
mvn package
java -jar target/cicd-demo-backend-1.0.0.jar   # 独立运行打包后的 jar

# 前端 → dist/
cd frontend
npm run build
npm run preview     # 本地预览打包结果（端口 4173，同样代理 /api）
```

## 4. 跑测试（练习 CI 里的"质量门禁"环节）

```bash
# 后端单元测试
cd backend && mvn test

# 前端单元测试 + 类型检查
cd frontend && npm test && npm run typecheck
```

## 5. 接口清单

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/hello` | 问候语 + 服务器时间 + 用户数 |
| GET | `/api/health` | 探活 `{"status":"UP"}` |
| GET | `/api/users` | 用户列表（预置 3 条假数据） |
| GET | `/api/users/{id}` | 单个用户（不存在返回 404） |
| POST | `/api/users` | 新增用户，body：`{"name":"xx","email":"xx","role":"xx"}` |
| DELETE | `/api/users/{id}` | 删除用户（204） |

## 6. 用它练习 CI/CD（建议步骤）

`.github/workflows/ci.yml` 已经写好：前端 job 跑 `npm ci → typecheck → test → build`，
后端 job 跑 `mvn test → mvn package`，并上传构建产物（artifact）。

1. `git init` + 推到你的 GitHub 仓库，打开 Actions 页签看流水线自动跑
2. **故意弄坏它**：写一个会失败的测试 / 改坏一个类型，push，看流水线变红、看日志定位
3. 修好再 push，看流水线变绿——这就是 CI 的核心循环
4. 配置 branch protection：红灯不许合并 PR（质量门禁）
5. 进阶：给流水线加依赖缓存、矩阵构建（多 Node / 多 JDK 版本）、
   打 tag 时自动把 `dist/` 部署到 GitHub Pages / 服务器（CD）

> 用 GitLab 的话照着 `.gitlab-ci.yml` 的思路翻译即可：stages: test → build → deploy，
> 语法不同但概念一一对应。
