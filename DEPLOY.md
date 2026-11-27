# CD 练习：自动部署前端到 GitHub Pages

> CI 章节（EXERCISES.md）你已经毕业了。这一课学 **CD（持续部署）**：
> **合并进 main → 流水线自动打包 → 自动发布上线 → 拿到一个真的公网网址**。
>
> 本课所有代码都由**你自己动手抄进去**，我只提供代码和讲解。

---

## 第 1 步：修 vite 配置（2 行）

**为什么**：GitHub Pages 给的网址带文件夹后缀（`https://用户名.github.io/CI-CD-Demo/`）。
Vite 打包默认生成**绝对路径**（`/assets/xxx.js`，意思是"去服务器根目录找"），
放到子文件夹里就找不到资源 → **打开页面白屏**。这是部署阶段最经典的坑。

**怎么做**：打开 `frontend/vite.config.ts`，在 `defineConfig({` 的下一行加 2 行：

```ts
export default defineConfig({
  // 部署到 GitHub Pages 这类"子路径"时必须用相对路径，否则页面白屏
  base: './',
  plugins: [react()],
  // ……后面的内容全部不动
```

改完的效果：打包产物里的资源引用从 `/assets/...` 变成 `./assets/...`，
放哪都能跑。**本地开发完全不受影响。**

---

## 第 2 步：新建 CD 流水线（照抄整个文件）

**怎么做**：新建文件 `.github/workflows/deploy.yml`，内容如下（逐段看注释）：

```yaml
# CD：推送到 main 就自动把前端构建产物部署到 GitHub Pages
name: deploy

on:
  push:
    branches: [main]        # 合并进 main = 自动上线
  workflow_dispatch:        # 也可以在网页上手动部署（X3 学过的按钮）

# GitHub Pages 部署所需的最小权限（安全习惯：只给需要的权限）
permissions:
  contents: read
  pages: write
  id-token: write

# 同一时间只允许一次部署，新部署会取消进行中的旧部署（防止乱序上线）
concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: frontend/dist      # 把 dist/ 作为"部署包"交给下一步

  deploy:
    needs: build                   # X4 学的：构建绿了才部署
    runs-on: ubuntu-latest
    environment:                   # 部署环境：仓库里会多一条 Deployments 记录
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}   # 部署完输出公网地址
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

结构一图流（全是学过的零件）：

```
on: push(main)          ← 触发（L1 学的）
  └─ build              ← 打包 job
       ↓ needs          ← 先后顺序（X4 学的）
     deploy             ← 发布 job（新东西：environment 环境标记）
```

---

## 第 3 步：一次性设置（10 秒，必须在推送前做）

**GitHub 仓库 → Settings → Pages → Build and deployment → Source 选 `GitHub Actions`**

（默认是 "Deploy from a branch"，要改。不改的话 deploy job 会报
`Pages site not found` 之类的错。）

---

## 第 4 步：提交并推送（命令给你，你来敲）

```bash
cd E:\cicd
git add .github/workflows/deploy.yml frontend/vite.config.ts
git commit -m "cd: 自动部署前端到 GitHub Pages"
git push origin main
```

推完这一次，**以后就不用手动了**：每次合并进 main，自动重新发布。

---

## 第 5 步：验证（预期现象）

1. Actions 页多出一条 **deploy** 流水线，点进去看到**两层**：build → deploy（needs 生效）
2. deploy 的格子上有个 🌐 **github-pages** 标记（environment），点开能看到**公网地址**
3. 浏览器打开 `https://darkflamemasterdeath.github.io/CI-CD-Demo/`
   （手机也能开——这就是 CD 的成果）
4. ⚠️ **预期现象**：页面样式正常，但数据区显示"**无法连接后端**"。
   原因：Pages 上只有静态文件，没有 Spring Boot 接口。
   **这不是坏了**，是正常的——也正是下一课的动机（把后端也部署上去）。

---

## 知识点小抄

| 新概念 | 一句话 |
| --- | --- |
| `base: './'` | 子路径部署必须相对路径，否则白屏（本地无感、上线救命） |
| `permissions` | 最小权限原则：只给部署需要的 3 个权限 |
| `environment` | 部署环境标记，留 Deployments 记录；以后可做"生产需人工批准" |
| `concurrency` | 防两次部署赛跑乱序：新部署取消旧部署 |
| `upload-pages-artifact` | 把构建产物打包交给部署步骤（产物思想，X1 学过） |
| CI 与 CD 的关系 | CI = 改代码自动检查；CD = 检查过了自动上线。合起来就是 CI/CD |

## 常见问题排查

| 现象 | 原因 |
| --- | --- |
| 页面白屏，控制台一堆 404 | 第 1 步没做（base 没配） |
| deploy 报 `Pages site not found` / 404 | 第 3 步没做（Pages 源没选 GitHub Actions） |
| deploy 报权限相关错误 | `permissions` 那三行没抄全 |
| 页面数据区红字"无法连接后端" | 正常！见第 5 步第 4 条 |
