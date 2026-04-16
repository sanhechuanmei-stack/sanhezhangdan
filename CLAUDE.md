后续所有页面新增、页面修改、样式调整、功能优化，都默认必须同时兼容桌面端和移动端，不需要我每次单独提醒。

也就是说：
1. 任何新做的页面，默认都要做响应式适配
2. 任何已有页面的修改，默认都要同步检查手机端和电脑端效果
3. 不允许只改电脑端、不管手机端
4. 不允许只做手机端、不管电脑端
5. 桌面端和移动端都要作为交付标准的一部分
6. 如果某个模块在手机端不适合完全照搬，可以主动改成更适合移动端的展示方式，但要保证功能逻辑一致
7. 以后除非我特别说明某个页面只做单端，或者修改增加等单端，否则默认双端同步适配

每次跟我沟通的时候，都叫我李哥。同时你的语气要非常的温柔且脾气很好，如果感觉到我的语气愤怒或者暴躁要和我进行道歉。

每次在让我查看/测试新效果的时候，都发我需要给终端发什么话，以及手机端和电脑端的看效果的链接。

## 数据存储架构
本项目采用 localStorage + Supabase 双重存储机制：
- **本地缓存**: localStorage，key: `xiaoyan-qianfang-data`
- **云端数据库**: Supabase（`hzcinrzebmmvdiimmfuz.supabase.co`）
  - 同步表: partners, projects, bills, sharing_records, expense_categories
  - 存储桶: `attachments`（凭证附件，自动压缩≤500KB）
- **同步策略**: 启动时拉取云端数据，状态变化时同时写入本地和云端
- **备份**: 支持手动导出 JSON 文件（`三和记账备份_[日期].json`）

## 数据同步规则
后续在更新网站内容（新增、修改、删除数据）时，默认必须同时同步到云端（Supabase）和本地（localStorage），不需要每次单独提醒。
1. 任何数据变更，默认双端同步（本地 + 云端）
2. 不允许只写本地不同步云端，也不允许只写云端不更新本地
3. 除非特别说明，否则默认双端同步

## 外部API
- **豆包AI**（字节跳动）: 用于AI快速记账语义解析，API Key 配置在 `.env.local` 的 `VITE_ARK_API_KEY`

## 线上部署架构
网站已部署到线上，采用 GitHub + Vercel 自动部署方案：

- **线上域名**: https://sanhezhangdan.top
- **备用域名**: https://sanhezhangdan.vercel.app
- **GitHub 仓库**: https://github.com/sanhechuanmei-stack/sanhezhangdan
- **GitHub 用户名**: sanhechuanmei-stack
- **Vercel 项目**: sanhezhangdan

## 代码更新流程
**标准修改顺序（每次改网站都按这个来）：**
1. 李哥告诉我要改什么
2. 我在本地文件改好
3. 李哥在本地确认效果（可选，运行 `npm run dev` 预览）
4. 李哥在终端运行以下命令推送到 GitHub：
```bash
cd "/Volumes/固态/三和记账系统/eduflow-dashboard-main"
git add . && git commit -m "更新内容" && git push
```
5. 等待 1-2 分钟，Vercel 自动部署，线上网站自动更新

**注意：不要直接在 Vercel 上改代码，始终以本地文件为准。**

## 本地开发环境
- **本地项目路径**: `/Volumes/固态/三和记账系统/eduflow-dashboard-main/`
- **本地启动命令**: `npm run dev`（在项目目录下运行）
- **本地访问地址**: `http://localhost:8080`（注意：已移除 basicSsl 插件，本地不再强制 HTTPS）

## DNS 配置记录（腾讯云）
域名 `sanhezhangdan.top` 在腾讯云的 DNS 解析配置：
- `@` → A 记录 → `216.198.79.1`（Vercel）
- `www` → CNAME → `cname.vercel-dns.com`（Vercel）

## Vercel 环境变量
已在 Vercel 配置的环境变量（Production + Preview + Development）：
- `VITE_ARK_API_KEY` = 豆包AI API Key（已配置，勿重复添加）
