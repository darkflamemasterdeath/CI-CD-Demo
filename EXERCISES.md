# CI/CD 练习手册（前端 React + 后端 Spring Boot）

配合 `E:\cicd` 项目使用。每题都有【做什么】【看到什么】【知识点】。
做完一项勾一项，遇到卡住的先看"预期现象"对不对——CI 学习的核心是**观察**。

代码仓库：https://github.com/darkflamemasterdeath/CI-CD-Demo
流水线文件：`.github/workflows/ci.yml`

---

## L1 入门：让流水线变红，再变绿（学会读日志）

### F1. 弄红前端测试 ⭐

- [ ] **做什么**：改 `frontend/src/utils/format.test.ts`，
  把 `expect(result).toContain('2026')` 改成 `'2027'`，提交并 push。
- [ ] **看到什么**：Actions 里 **frontend 红叉**、backend 绿。
  点进 frontend → `npm test` 步骤 → 日志里有 `expected ... to contain 2027` 的断言差异。
- [ ] **知识点**：CI 的价值 = 每次 push 自动跑测试，坏了马上知道是哪条断言。
  修回来 push → 绿。

### B1. 弄红后端测试 ⭐

- [ ] **做什么**：改 `backend/src/test/java/com/example/demo/service/UserServiceTest.java`，
  把 `hasSizeGreaterThanOrEqualTo(3)` 改成 `30`，push。
- [ ] **看到什么**：**backend 红叉**、frontend 绿。日志里 surefire 报告 `Tests run: 4, Failures: 1`。
- [ ] **知识点**：两个 job 是**并行且独立**的，一个红不影响另一个。
  前后端各自的测试失败互不干扰。

### F2. 弄坏前端类型 ⭐

- [ ] **做什么**：在 `frontend/src/App.tsx` 顶部随便加一行
  `const oops: number = '字符串'`，push。
- [ ] **看到什么**：frontend 红叉，但**挂在 `npm run typecheck` 这一步**，还没跑到测试。
- [ ] **知识点**：流水线步骤有顺序（装依赖 → 类型检查 → 测试 → 构建），
  **前面的门禁挂了，后面的步骤根本不执行**。这就是"质量门禁"。

### B2. 弄坏后端编译 ⭐

- [ ] **做什么**：打开 `backend/src/main/java/com/example/demo/service/UserService.java`，
  随便删掉一行末尾的分号 `;`，push。
- [ ] **看到什么**：backend 红叉，挂在 `mvn test` 之前的**编译阶段**，
  日志是 `';' expected` 之类的 javac 报错。
- [ ] **知识点**：编译错误比测试失败更早被拦截。
  对比 F2/B2 和 F1/B1：**编译/类型 → 测试 → 构建**，一道道门依次把关。

---

## L2 进阶：完整开发循环（写代码 → 补测试 → 全绿 → 拿产物）

### F3. 给前端加一个"刷新"按钮 ⭐⭐

- [ ] **做什么**：在 `frontend/src/App.tsx` 的"后端状态"卡片里加一个"刷新"按钮，
  点击后重新调用 `load()`。顺手给 `frontend/src/utils/format.ts` 写一个新函数
  （比如 `formatRelativeTime`），并在 `format.test.ts` 里**为它写 2 个测试**。push。
- [ ] **看到什么**：三个 job 全绿，测试数量从 2 变成 4。
- [ ] **知识点**：健康的开发循环 = **新代码必须带测试**。
  CI 保证你不会"忘了跑测试"——push 就是提交给测试。

### B3. 给后端加一个统计接口 ⭐⭐

- [ ] **做什么**：在 `backend/.../controller/SystemController.java` 加一个
  `GET /api/stats`，返回 `{"userCount": 3, "roles": {"管理员":1, ...}}`（统计各角色人数）。
  同时在 `UserServiceTest.java` 里**为新逻辑写 2 个测试**。push。
- [ ] **看到什么**：backend 全绿，测试数增加。本地启动后
  `curl http://localhost:8080/api/stats` 能看到统计 JSON。
- [ ] **知识点**：接口 + 测试一起提交是团队规范的底线，CI 是执法者。

### X1. 产物练习：下载并运行 CI 的构建产物 ⭐⭐

- [ ] **做什么**：等流水线绿了 → 点进那次运行 → 底部 **Artifacts** →
  下载 `backend-jar` 和 `frontend-dist`，解压。
- [ ] **看到什么**：
  ```bash
  java -jar cicd-demo-backend-1.0.0.jar        # 后端产物能直接跑
  cd dist && npx serve .                       # 前端产物是纯静态文件
  ```
- [ ] **知识点**：**产物（artifact）就是"交付物"**。
  流水线的输出不是日志，而是这个可以部署的东西。CD 部署的就是它。

### X2. 弄出 404，验证错误处理 ⭐⭐

- [ ] **做什么**：本地起后端，`curl http://localhost:8080/api/users/99999`，
  看返回的 JSON 错误体；再给 `UserServiceTest` 补一个"删除不存在的 id 应抛异常"的测试。push。
- [ ] **看到什么**：404 返回 `{"status":404,"message":"用户不存在: 99999",...}`；
  新测试全绿。
- [ ] **知识点**：边界条件也是测试的一部分；错误响应格式要在 CI 里被保护住。

---

## L3 高级：折腾流水线本身（学会配 CI）

### X3. 加一个手动触发按钮 ⭐⭐

- [ ] **做什么**：ci.yml 的 `on:` 下加一行：
  ```yaml
  on:
    workflow_dispatch:      # 手动触发
    push: ...
  ```
  push 后去 Actions 页看 workflow 右上角。
- [ ] **看到什么**：出现 **"Run workflow" 按钮**，点它能手动跑一次。
- [ ] **知识点**：触发方式除了 push/PR，还有手动、定时（`schedule: cron`）、tag 等。

### X4. 用 needs 让 job 有先后顺序 ⭐⭐⭐

- [ ] **做什么**：拆出一个 `test` job（只跑前端测试+后端测试），
  然后让 `frontend`/`backend` 的 build job 加 `needs: test`。
  ```yaml
  jobs:
    test: { ... }
    frontend:
      needs: test    # test 绿了才跑
  ```
- [ ] **看到什么**：运行详情页里 job 变成**两层**：上层 test，绿了下层才开始。
- [ ] **知识点**：`needs` 表达依赖；失败的上游会**直接跳过**下游（省时间省资源）。

### X5. 矩阵构建：一次测多个 Node 版本 ⭐⭐⭐

- [ ] **做什么**：frontend job 加：
  ```yaml
  strategy:
    matrix:
      node-version: [18, 20, 22]
  ```
  步骤里 `node-version: ${{ matrix.node-version }}`。
- [ ] **看到什么**：frontend 一次跑出 **3 个并行小格子**，每个 Node 版本一格。
- [ ] **知识点**：矩阵 = 笛卡尔积批量验证兼容性，写一次配置跑 N 种组合。

### X6. 分支保护：红灯不许合并 ⭐⭐⭐

- [ ] **做什么**：GitHub 仓库 → Settings → Branches → main →
  勾选 **Require status checks to pass**，把 `frontend` / `backend` 加进去。
  然后开一个 PR，里面故意弄红一个测试。
- [ ] **看到什么**：PR 页面的 **Merge 按钮变灰**，提示检查未通过。
  修绿后才能合并。
- [ ] **知识点**：这是 CI 从"提醒"升级为"强制"的关键一步——
  **红灯合不进去**，坏代码进不了主干。

### X7. tag 触发：打版本号才发布 ⭐⭐⭐

- [ ] **做什么**：ci.yml 加一个独立 workflow（或 job）：
  ```yaml
  on:
    push:
      tags: ['v*']
  ```
  内容是打包 + 上传产物。然后 `git tag v1.0.0 && git push origin v1.0.0`。
- [ ] **看到什么**：普通 push 不触发它，**只在推 tag 时**出现运行记录。
- [ ] **知识点**：这是 CD 的雏形——"打版本号 = 发布"，发布和日常提交分开。

---

## 建议路线

- 第 1 天：L1 全部（F1 F2 B1 B2）—— 学会看红叉、读日志
- 第 2-3 天：L2 全部（F3 B3 X1 X2）—— 走通"开发→测试→产物"全流程
- 之后每天挑一个 L3 —— 学会配置流水线，做完你就超过大部分只会写业务代码的人了

## 遇到问题时的排查顺序（万能三板斧）

1. **看事件三件套**：run 的 event（push/PR）+ branch + SHA —— 确认是谁触发的
2. **看挂在第几步**：点开红叉的 job，红色高亮的步骤就是凶手
3. **看日志最后 30 行**：真正的报错信息在最后，上面一堆 Downloading 可以无视
