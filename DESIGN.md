# Design System — siyuan-query-builder（易搭）

## 产品背景

- **产品定位：** SiYuan Notes 插件，运行在思源笔记的 Dialog 窗口内
- **目标用户：** 思源笔记的高级用户和开发者，需要可视化查询和多视图浏览笔记块
- **产品类型：** 数据密集型工具面板（Dashboard/Workspace）
- **视觉身份：** 独立风格，不依附思源原生 UI，但气质上与思源相容

## 美学方向

- **方向：** 有机学术风（Organic/Scholarly）
- **装饰等级：** Intentional（意图性装饰）
- **氛围：** 像书桌上的学术笔记本，不是工具软件。暖色调、自然纹理感、克制装饰。数据和空白共同工作，而不是用颜色制造噪音。

### 风险选择（差异化所在）

1. **衬线字体用于标题**（Palatino/宋体）—— PKM 插件几乎清一色无衬线，这带来「学术笔记本」气质，与所有同类插件拉开距离。
2. **径向渐变背景而非纯色** —— 薄薄一层双向渐变（绿+金），增加手工质感，避免死板的纯色背景。
3. **琥珀金点缀色** —— 大多数绿色主题用蓝色或灰色点缀，金色罕见，与森林绿形成自然互补，带来手工艺品般的温度。

## 字体

```
--sqb-serif: 'Palatino Linotype', 'Book Antiqua', Georgia, 'Source Han Serif SC', 'Songti SC', serif;
--sqb-sans:  'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
--sqb-mono:  'JetBrains Mono', 'Fira Code', monospace;
```

| 角色 | 字体变量 | 用途 |
|------|----------|------|
| 标题 / Hero | `--sqb-serif` | h1（面板品牌名）、h2（卡片标题） |
| 正文 / UI | `--sqb-sans` | 正文、标签、按钮、表单 |
| 数据 / 表格 | `--sqb-sans` + `tabular-nums` | 结果表格中的数字列 |
| 代码 / SQL | `--sqb-mono` | SQL 预览、代码展示 |

**字号层级**（基准 13px，适配思源紧凑 UI）：

| Token | px | 用途 |
|-------|----|------|
| 2xs | 11px | Eyebrow kicker、角标 |
| xs | 12px | 辅助标注、tooltip |
| sm | 13px | **正文基准** |
| md | 15px | 次级标题、强调文字 |
| lg | 18px | 卡片标题（h2） |
| xl | 22px | 面板 Hero 标题（h1） |

**加载：** 纯系统字体栈，无 web font 依赖（插件在本地客户端运行）。

## 色彩

**方案：** Restrained（克制）—— 1 个强调色 + 1 个点缀色 + 中性色，色彩稀少且有意义。

### 浅色模式

| Token | 变量名 | 值 | 含义 |
|-------|--------|----|------|
| 背景 | `--sqb-bg` | `#faf6f0` | 羊皮纸白 |
| 强背景 | `--sqb-bg-strong` | `#f0ece4` | 悬停底、分隔区 |
| 表面 | `--sqb-surface` | `rgba(255,255,255,0.84)` | 卡片、面板 |
| 表面强 | `--sqb-surface-strong` | `#ffffff` | 输入框、弹层 |
| 表面柔 | `--sqb-surface-soft` | `rgba(245,241,234,0.92)` | 次级卡片 |
| 表面哑 | `--sqb-surface-muted` | `rgba(234,230,222,0.9)` | 禁用区域 |
| 边框 | `--sqb-border` | `rgba(116,121,110,0.2)` | 默认边框 |
| 强边框 | `--sqb-border-strong` | `rgba(116,121,110,0.32)` | 焦点边框 |
| 文字 | `--sqb-text` | `#2e3230` | 主文字 |
| 哑文字 | `--sqb-text-muted` | `#62685f` | 辅助文字 |
| 主色 | `--sqb-primary` | `#4a7c59` | 森林绿，主操作 |
| 主色强 | `--sqb-primary-strong` | `#355f42` | 主色悬停/按下 |
| 主色柔 | `--sqb-primary-soft` | `rgba(74,124,89,0.12)` | 主色背景 |
| 辅助色 | `--sqb-secondary` | `#6b6358` | 旧木棕，次级操作 |
| 辅助柔 | `--sqb-secondary-soft` | `rgba(107,99,88,0.12)` | 辅助色背景 |
| 点缀色 | `--sqb-accent` | `#c4a66a` | 琥珀金，高亮/badge |
| 点缀柔 | `--sqb-accent-soft` | `rgba(196,166,106,0.18)` | 点缀色背景 |
| 危险 | `--sqb-danger` | `#b83230` | 删除、错误 |
| 危险柔 | `--sqb-danger-soft` | `rgba(184,50,48,0.12)` | 危险背景 |
| 信息 | `--sqb-info` | `#5b7fa6` | 提示、链接 |

**背景渐变（保留）：**
```css
background:
  radial-gradient(circle at top left, rgba(142,207,158,0.14), transparent 28%),
  radial-gradient(circle at top right, rgba(196,166,106,0.18), transparent 26%),
  linear-gradient(180deg, #faf6f0 0%, #f7f2ea 52%, #f1ece3 100%);
```

### 深色模式

| Token | 变量名 | 值 |
|-------|--------|---------|
| 背景 | `--sqb-bg` | `#1e2220` |
| 强背景 | `--sqb-bg-strong` | `#252b27` |
| 表面 | `--sqb-surface` | `rgba(38,44,40,0.88)` |
| 表面强 | `--sqb-surface-strong` | `#2e3632` |
| 表面柔 | `--sqb-surface-soft` | `rgba(32,38,34,0.92)` |
| 表面哑 | `--sqb-surface-muted` | `rgba(28,34,30,0.9)` |
| 边框 | `--sqb-border` | `rgba(140,160,148,0.18)` |
| 强边框 | `--sqb-border-strong` | `rgba(140,160,148,0.28)` |
| 文字 | `--sqb-text` | `#e8e4dc` |
| 哑文字 | `--sqb-text-muted` | `#9ea89c` |
| 主色 | `--sqb-primary` | `#6aab7e` |
| 主色强 | `--sqb-primary-strong` | `#82c294` |
| 主色柔 | `--sqb-primary-soft` | `rgba(106,171,126,0.15)` |
| 辅助色 | `--sqb-secondary` | `#8c8278` |
| 辅助柔 | `--sqb-secondary-soft` | `rgba(140,130,120,0.15)` |
| 点缀色 | `--sqb-accent` | `#d4b47a` |
| 点缀柔 | `--sqb-accent-soft` | `rgba(212,180,122,0.18)` |
| 危险 | `--sqb-danger` | `#d05654` |
| 危险柔 | `--sqb-danger-soft` | `rgba(208,86,84,0.15)` |
| 信息 | `--sqb-info` | `#7aa0c8` |

深色模式深背景渐变：
```css
background:
  radial-gradient(circle at top left, rgba(106,171,126,0.08), transparent 28%),
  radial-gradient(circle at top right, rgba(212,180,122,0.10), transparent 26%),
  linear-gradient(180deg, #1e2220 0%, #1b2620 52%, #192320 100%);
```

**深色模式触发（CSS）：**
```css
@media (prefers-color-scheme: dark) {
  #siyuan-query-builder-root { /* 深色变量 */ }
}
/* 或通过 SiYuan 主题类名 .b3-theme-dark */
.b3-theme-dark #siyuan-query-builder-root { /* 深色变量 */ }
```

## 间距

**基础单位：** 4px
**密度：** Compact（数据密集型工具）

| Token | px | 典型用途 |
|-------|----|----------|
| 2xs | 2 | 图标内边距 |
| xs | 4 | 行内小元素间距 |
| sm | 8 | 组件内边距 |
| md | 12 | 卡片内边距，组件间距 |
| lg | 16 | 区块内边距 |
| xl | 24 | 卡片外边距，主要分区 |
| 2xl | 32 | 面板级间距 |
| 3xl | 48 | 最大结构间距 |

## 圆角

| Token | 值 | 用途 |
|-------|----|------|
| sm | 4px | Badge、角标、小 tag |
| md | 8px | 按钮、输入框、下拉框 |
| lg | 12px | 卡片、面板 |
| xl | 16px | 主面板容器、inline fallback |
| full | 9999px | Pill 标签、头像 |

## 动效

**方向：** Minimal-functional（仅辅助理解的动效，不做炫技）

| 类型 | Easing | Duration | 用途 |
|------|--------|----------|------|
| Hover/focus 状态 | `ease-out` | 80ms | 颜色、边框变化 |
| 展开/收起 | `ease-in-out` | 180ms | 侧边栏区块折叠 |
| 面板切换 | `ease-in-out` | 280ms | Tab 切换、视图切换 |
| 退出动效 | `ease-in` | 150ms | 元素消失 |

无滚动驱动动效，无装饰性动画。

## 布局

- **结构：** 三栏（侧边栏 220px + 编辑区 flex-1 + 结果区 flex-1）
- **方式：** Grid-disciplined，内部 Flexbox 辅助
- **最大宽度：** 受思源 Dialog 尺寸约束，不设固定 max-width
- **响应性：** Dialog 宽度可拖拽，侧边栏可折叠

## 语义色用法

| 语义 | 颜色 | 变量 |
|------|------|------|
| Success / 完成 | 森林绿 | `--sqb-primary` |
| Warning / 注意 | 琥珀金 | `--sqb-accent` |
| Error / 危险 | 砖红 | `--sqb-danger` |
| Info / 提示 | 石板蓝 | `--sqb-info` |

## 决策日志

| 日期 | 决策 | 理由 |
|------|------|------|
| 2026-03-22 | 延续现有暖色有机调色板 | 现有 CSS 变量已有完整语义，系统化整理优于推倒重来 |
| 2026-03-22 | 保持独立视觉身份，不使用思源原生 CSS 变量 | 插件需要在不同思源主题下有稳定外观 |
| 2026-03-22 | 新增深色模式色板 | 用户明确需求，延续同一色调降温降饱和 |
| 2026-03-22 | 新增 `--sqb-mono` 代码字体 | SQL 预览需要等宽字体，原规范缺失 |
| 2026-03-22 | 新增 `--sqb-info` 信息色 `#5b7fa6` | 语义色中缺少「信息/提示」类别，补全语义完整性 |
| 2026-03-22 | 衬线字体用于 h1/h2 标题 | 与 PKM 同类插件形成差异，带来「学术笔记本」气质 |
| 2026-03-22 | 圆角 xl 从 20px 收至 16px | 与圆角体系对齐，20px 是孤值 |