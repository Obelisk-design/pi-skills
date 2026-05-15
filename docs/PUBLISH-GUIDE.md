# PI-Skills GitHub 发布指南

## 一、创建 GitHub 仓库

### 1. 在 GitHub 创建新仓库

1. 登录 GitHub
2. 点击 "New repository"
3. 仓库名称：`pi-skills`
4. 描述：`前端开发全流程管理 AI 技能集合`
5. 选择 Public（公开）
6. 不要勾选 "Add a README file"（我们已有）
7. 点击 "Create repository"

### 2. 初始化 Git 并推送

```bash
cd ~/.claude/skills/pi-skills

# 初始化 Git
git init

# 添加所有文件
git add .

# 创建首次提交
git commit -m "Initial release: 7 core skills for frontend development workflow"

# 添加远程仓库（替换 YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/pi-skills.git

# 推送到 GitHub
git push -u origin main
```

---

## 二、发布到 npm（可选）

如果希望通过 npm 安装：

### 1. 注册 npm 账号

```bash
npm login
```

### 2. 发布包

```bash
npm publish
```

### 3. 用户安装方式

```bash
npm install -g pi-skills
```

---

## 三、用户安装方式

### 方式一：Git Clone（推荐）

用户在 Claude Code 中执行：

```bash
git clone --single-branch --depth 1 https://github.com/YOUR_USERNAME/pi-skills.git ~/.claude/skills/pi-skills && cd ~/.claude/skills/pi-skills && ./setup
```

### 方式二：npm 安装（如果已发布）

```bash
npm install -g pi-skills
```

然后在 Claude Code settings.json 添加：

```json
{
  "skills": {
    "userSettings": {
      "pi-skills": "~/.claude/skills/pi-skills"
    }
  }
}
```

### 方式三：项目级安装

在项目 `.claude/skills/` 目录下创建 `required` 文件：

```
echo "pi-skills" > .claude/skills/required
```

团队成员克隆项目后会自动安装。

---

## 四、更新 package.json

发布前需要修改 `package.json` 中的仓库地址：

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/pi-skills.git"
  }
}
```

同时更新 `README.md` 和 `setup` 脚本中的 YOUR_USERNAME。

---

## 五、目录结构确认

发布前的目录结构：

```
pi-skills/
├── .gitignore
├── LICENSE           # MIT License
├── VERSION           # 1.0.0
├── package.json      # npm 配置
├── setup             # 安装脚本
├── SKILL.md          # 入口技能定义
├── README.md         # 英文文档
├── docs/
│   ├── dsl-value-analysis.md
│   ├── dsl-error-analysis.md
│   └── triangular-validation-analysis.md
├── pi-modao-capture/
│   └── SKILL.md
│   └── scripts/
├── pi-yapi/
│   └── SKILL.md
├── pi-fe-view-dsl-engine/
│   └── SKILL.md
├── pi-be-data-dsl-engine/
│   └── SKILL.md
├── pi-integrate-fe-be/
│   └── SKILL.md
├── pi-review/
│   └── SKILL.md
│   └── scripts/
│       └── dsl-compare.js
├── pi-workflow/
│   └── SKILL.md
│   └── README-CN.md  # 中文简介
└── scripts/
    └── setup.js      # 可选的 Node.js 安装脚本
```

---

## 六、添加 LICENSE 文件

```bash
cd ~/.claude/skills/pi-skills
echo "MIT License" > LICENSE
echo "" >> LICENSE
echo "Copyright (c) 2025 YOUR_USERNAME" >> LICENSE
echo "" >> LICENSE
echo "Permission is hereby granted, free of charge..." >> LICENSE
```

---

## 七、发布检查清单

发布前确认：

- [ ] package.json 中 repository.url 已更新为正确的 GitHub 地址
- [ ] README.md 中 YOUR_USERNAME 已替换
- [ ] setup 脚本中 YOUR_USERNAME 已替换
- [ ] VERSION 文件包含正确版本号
- [ ] LICENSE 文件已创建
- [ ] 所有 SKILL.md 文件的 description 字段正确
- [ ] .gitignore 包含必要排除项
- [ ] docs 目录包含分析文档

---

## 八、版本更新流程

当需要更新版本时：

```bash
# 1. 更新 VERSION 文件
echo "1.1.0" > VERSION

# 2. 更新 package.json 版本
# 手动修改或使用 npm version
npm version patch  # 或 minor / major

# 3. 提交变更
git add .
git commit -m "Release v1.1.0: add new features"

# 4. 推送到 GitHub
git push origin main

# 5. 如果发布到 npm
npm publish
```

---

## 九、常见问题

### Q: 技能没有被 Claude Code 识别？

确认技能目录在 `~/.claude/skills/pi-skills/` 下，且包含 `SKILL.md` 文件。

### Q: 如何让团队成员自动安装？

在项目 `.claude/skills/` 创建 `required` 文件，内容为 `pi-skills`。

### Q: 如何指定特定版本？

在 `required` 文件中写入 `pi-skills@1.0.0`。

---

## 十、推广建议

发布后可以：

1. 在 README.md 添加使用示例截图
2. 创建 GitHub Discussions 用于问题讨论
3. 添加 GitHub Actions 用于自动化测试（如有）
4. 编写博客文章介绍技能集合的价值