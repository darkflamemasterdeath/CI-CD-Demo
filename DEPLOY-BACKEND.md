# CD 第二课：把后端也部署上线（免费）

> 现状：前端已上线 GitHub Pages，但页面数据区报"无法连接后端"。
> 本课目标：**给页面配上真正的后端 API**，手机打开也有数据。
>
> 所有代码由你自己抄，我只提供代码和讲解。

## 背景：为什么后端"上不去"

GitHub Pages 是**静态文件托管**——只会把 html/js/css 原样发给浏览器，跑不了 Java。
后端需要一台**常驻的服务器**。免费方案用 **Render.com**（绑 GitHub 仓库自动部署、
免信用卡、免费额度够练习）。

> 💡 预期提醒：Render 免费实例闲置约 15 分钟会**休眠**，之后第一次访问要等它醒来
> （约 30~60 秒白等），醒来后就正常了。这是免费的代价，不是坏了。

## 全景图（先看懂这张图再动手）

```
浏览器（手机/电脑）
   │
   ├─ 打开 https://用户名.github.io/CI-CD-Demo/     ← GitHub Pages（前端，已上线 ✅）
   │
   └─ 页面里 fetch(VITE_API_BASE + '/api/users')
              │
              ▼
      https://xxx.onrender.com/api/users             ← Render（后端，本课要上线）
```

需要动的地方一共 3 处 + 网页操作 2 处：

| # | 动什么 | 为什么 |
| --- | --- | --- |
| ① | 后端加 `Dockerfile` | 让 Render 知道怎么打包、怎么运行你的 Java |
| ② | 后端 `CorsConfig.java` 放行线上域名 | 浏览器的跨域保护会拦截不认识的来源 |
| ③ | 前端 API 地址改成可配置 | 本地指 localhost，上线指 Render，一套代码两用 |
| ④ | Render 网页：建服务（照抄参数） | 部署后端 |
| ⑤ | GitHub 网页：加一个 Variables | 把 Render 网址告诉前端构建 |

---

## 第 1 步：新建 `backend/Dockerfile`（照抄）

Dockerfile = "如何把我的代码做成一个能跑的镜像"的说明书。用**两阶段构建**：
先用 Maven 打包，再用 JRE 运行——最终镜像里只有 jar，没有源码和编译器（瘦）。

```dockerfile
# ===== 阶段 1：打包（用完就扔）=====
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build
COPY pom.xml .
COPY src ./src
RUN mvn -B package -DskipTests

# ===== 阶段 2：运行（最终镜像）=====
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /build/target/cicd-demo-backend-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

逐行翻译：
- `FROM ... AS build`：拿一个装好 Maven+JDK 的环境来打包（阶段名叫 build，用完就扔）
- `COPY pom.xml . / COPY src ./src`：把构建文件和源码拷进去
- `RUN mvn -B package -DskipTests`：在镜像里打包出 jar（跳过测试——CI 已经测过了）
- `FROM eclipse-temurin:17-jre-alpine`：换一个只装了 Java 运行时的小镜像
- `COPY --from=build ...`：**从阶段 1 里**把打好的 jar 拷过来
- `EXPOSE 8080`：声明端口（对齐 application.yml）
- `ENTRYPOINT`：容器启动时执行的命令

> 为什么不能一行 `COPY target/xxx.jar`？因为仓库里 `target/` 被 .gitignore 了，
> 干净的构建机器上没有 jar，必须现场打包。两阶段构建就是干这个的。

## 第 2 步：CORS 放行线上域名（改一个文件）

打开 `backend/src/main/java/com/example/demo/config/CorsConfig.java`，改成：

```java
package com.example.demo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 跨域配置：浏览器只允许"认识的来源"访问接口，这里列白名单。
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(
                        "http://localhost:5173",                       // 本地开发
                        "http://127.0.0.1:5173",
                        "http://localhost:4173",                       // 本地预览
                        "http://127.0.0.1:4173",
                        "https://darkflamemasterdeath.github.io")      // ← 新增：线上前端
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }
}
```

**为什么**：网页在 `darkflamemasterdeath.github.io`，接口在 `xxx.onrender.com`，不同域名
= 浏览器眼里的"跨域"。后端不放行，浏览器直接拦截（F12 控制台报 CORS 错误）。

## 第 3 步：前端 API 地址改成可配置（改 1 行）

打开 `frontend/src/api/users.ts`，找到这一行：

```ts
const BASE_URL = '/api'
```

替换成：

```ts
// 线上部署时由构建系统注入 VITE_API_BASE（后端公网地址）；本地开发不配，走 vite 代理
const BASE_URL = `${import.meta.env.VITE_API_BASE ?? ''}/api`
```

**翻译**：`import.meta.env.VITE_API_BASE` 是 Vite 的"构建时环境变量"——
本地跑 `npm run dev` 没配它，就是空串 `''`，请求发到 `/api/...`（走代理到 localhost:8080，
和以前一模一样）；线上构建时注入了 `https://xxx.onrender.com`，请求就发到那边。

## 第 4 步：Render 建服务（网页操作，约 5 分钟）

1. 打开 <https://render.com> → **Get Started for Free** → 用 **GitHub 账号**登录（免信用卡）
2. **New → Web Service** → Connect a repository → 选 `CI-CD-Demo`
3. 填参数（照抄）：

| 项 | 填什么 |
| --- | --- |
| Name | `cicd-demo-backend`（这决定网址：`https://cicd-demo-backend.onrender.com`） |
| Region | 选亚洲的（Singapore/Tokyo） |
| Runtime | **Docker**（它会自动找到 `backend/Dockerfile`... 若要求填 Dockerfile 路径填 `backend/Dockerfile`） |
| Instance Type | **Free** |
| 其他 | 默认，点 **Deploy Web Service** |

4. 等它构建（第一次要下载 Maven 依赖，约 3~5 分钟），看到 **Live** 字样
5. **验证后端**：浏览器打开 `https://cicd-demo-backend.onrender.com/api/hello`，
   能看到 JSON 就成功了

> 如果 Runtime 选 Docker 时找不到文件路径设置，改用"Native"方案也行：
> Build Command 填 `mvn -B package -DskipTests`（Root Directory 填 `backend`），
> Start Command 填 `java -jar target/cicd-demo-backend-1.0.0.jar`。效果一样。

## 第 5 步：GitHub 加一个仓库变量（Secrets/Variables 入门）

**仓库 → Settings → Secrets and variables → Actions → Variables → New repository variable**

| 项 | 填什么 |
| --- | --- |
| Name | `VITE_API_BASE` |
| Value | `https://cicd-demo-backend.onrender.com`（第 4 步你的 Render 网址，末尾不要斜杠） |

> 📖 顺手学个概念：**Variables** 是明文配置（像 API 地址，不算机密）；
> **Secrets** 是加密配置（像 token、密码，日志里永远打不出来）。
> API 地址用 Variables 就够，真正的密钥才用 Secrets——这是 CI/CD 里管凭据的规矩。

## 第 6 步：deploy.yml 的 build 步骤加 2 行（抄）

在 `deploy.yml` 的 `- run: npm run build` 那一步改成：

```yaml
      - run: npm run build
        env:
          VITE_API_BASE: ${{ vars.VITE_API_BASE }}
```

**翻译**：构建前端时，把仓库变量塞进环境变量，前端代码里的 `import.meta.env.VITE_API_BASE`
就拿到了 Render 的地址。`${{ vars.XXX }}` 是 GitHub Actions 读变量的语法。

## 第 7 步：走 PR 合并（你的门禁要求，你已经会了）

```bash
git checkout -b cd-backend
git add backend/Dockerfile backend/src/main/java/com/example/demo/config/CorsConfig.java frontend/src/api/users.ts .github/workflows/deploy.yml DEPLOY-BACKEND.md
git commit -m "cd: 后端上线 Render + 前端 API 地址可配置"
git push origin cd-backend
```

开 PR → 等检查绿 → Merge → **合并后 deploy 流水线自动重新发布前端**（这次构建就带上
后端地址了）。

## 第 8 步：最终验证 🎯

1. 打开 `https://darkflamemasterdeath.github.io/CI-CD-Demo/`
2. **页面数据出来了**：后端状态卡片 + 3 个预置用户 + 能增删
3. 手机开一下（用的是同一个网址）
4. 故意刷新几次——注意 Render 免费实例休眠后**第一次**要等半分钟，别慌

## 知识点小抄

| 新概念 | 一句话 |
| --- | --- |
| PaaS | 平台即服务：你给代码/镜像，它给你一台跑着的服务器 |
| Dockerfile 两阶段构建 | 阶段1 打包、阶段2 只留运行时——镜像瘦身的标准做法 |
| CORS | 浏览器的跨域保镖：后端要白名单放行前端的域名 |
| `import.meta.env.VITE_*` | Vite 构建时注入的环境变量，一套代码适配多环境 |
| Variables vs Secrets | 明文配置 vs 加密凭据——密钥永远走 Secrets |

## 常见问题排查

| 现象 | 原因 |
| --- | --- |
| 页面数据区报错，F12 Console 有 CORS 字样 | 第 2 步没做（CORS 没放行线上域名） |
| 请求打到了 `github.io/api/...`（F12 Network 里看） | 第 3/5/6 步没配（VITE_API_BASE 没注入） |
| Render 构建报 `Cannot find target/*.jar` | Dockerfile 写成了单阶段（要两阶段，见第 1 步） |
| 第一次打开特别慢（半分钟） | Render 免费实例休眠冷启动，正常现象 |
| 本地 `npm run dev` 反而连不上后端了 | 第 3 步改坏了；`VITE_API_BASE` 为空时必须保持走 `/api` 代理 |
