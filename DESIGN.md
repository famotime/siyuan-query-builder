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
| lg | 12px | 内嵌小卡片 |
| xl | 16px | 标准卡片、区块 |
| 2xl | 20px | 控件区域、inline fallback |
| 3xl | 24px | 大卡片、结果容器 |
| hero | 28px | 侧边栏 hero 卡片、主面板容器 |
| full | 9999px | Pill 标签、头像 |

> **说明：** 2xl/3xl/hero 三个 token 基于现有实现验证，有机学术风偏向更柔和的大圆角，16px 以内的 xl 仅适用于小型组件。

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

## 缺失 Token 补全

### `--sqb-info-soft`（浅色模式）

| Token | 变量名 | 值 | 含义 |
|-------|--------|----|------|
| 信息柔 | `--sqb-info-soft` | `rgba(91,127,166,0.12)` | 信息色背景、提示区底色 |

### `--sqb-info-soft`（深色模式）

| Token | 变量名 | 值 |
|-------|--------|---------|
| 信息柔 | `--sqb-info-soft` | `rgba(122,160,200,0.15)` |

---

## 组件行为规范

### 按钮（Button）

三种变体，用途严格区分：

| 变体 | 用途 | 背景 | 文字 |
|------|------|------|------|
| Primary（填充） | 唯一主操作，每屏最多一个 | `--sqb-primary` | `#ffffff` |
| Secondary（轮廓） | 次级操作、取消 | transparent | `--sqb-text` |
| Ghost（文字） | 内联操作、工具栏图标按钮 | transparent | `--sqb-text-muted` |
| Danger（危险） | 删除、不可逆操作 | `--sqb-danger` | `#ffffff` |

状态规则：

| 状态 | Primary | Secondary | Ghost |
|------|---------|-----------|-------|
| Default | `--sqb-primary` bg | 1px border `--sqb-border-strong` | 无边框 |
| Hover | `--sqb-primary-strong` bg | bg `--sqb-bg-strong` | bg `--sqb-bg-strong` |
| Active/Pressed | 比 hover 再深 8% | bg `--sqb-bg-strong`, border `--sqb-primary` | bg `--sqb-primary-soft` |
| Disabled | opacity 0.4，pointer-events none | opacity 0.4 | opacity 0.4 |
| Focus | 焦点环（见可访问性规范） | 同上 | 同上 |

按钮尺寸：
- sm：height 26px，padding 0 8px，font-size xs(12px)，border-radius md(8px)
- md（默认）：height 32px，padding 0 12px，font-size sm(13px)，border-radius md(8px)
- lg：height 38px，padding 0 16px，font-size md(15px)，border-radius md(8px)

### 输入框（Input / Select / Textarea）

| 状态 | 边框 | 背景 |
|------|------|------|
| Default | `--sqb-border` | `--sqb-surface-strong` |
| Hover | `--sqb-border-strong` | `--sqb-surface-strong` |
| Focus | `--sqb-primary` 1px solid + 焦点环 | `--sqb-surface-strong` |
| Error | `--sqb-danger` 1px solid | `--sqb-danger-soft` |
| Disabled | `--sqb-border` opacity 0.5 | `--sqb-surface-muted` |

- 高度：28px（紧凑）或 32px（表单）
- border-radius：md(8px)
- 内边距：6px 10px
- placeholder 颜色：`--sqb-text-muted` opacity 0.6

### Badge / Tag

| 类型 | 背景 | 文字 | 用途 |
|------|------|------|------|
| 默认 | `--sqb-bg-strong` | `--sqb-text-muted` | 通用标签 |
| Primary | `--sqb-primary-soft` | `--sqb-primary-strong` | 状态激活、选中 |
| Accent | `--sqb-accent-soft` | `--sqb-accent` | 高亮、警告 |
| Danger | `--sqb-danger-soft` | `--sqb-danger` | 错误、删除 |
| Info | `--sqb-info-soft` | `--sqb-info` | 提示、链接类 |

- border-radius：sm(4px) 用于方形 tag，full(9999px) 用于 pill
- font-size：2xs(11px) 或 xs(12px)，font-weight 500
- padding：1px 6px（sm）或 2px 8px（md）

### 表格行（Table Row）

| 状态 | 背景 |
|------|------|
| Default | transparent |
| Hover | `--sqb-bg-strong` |
| Selected | `--sqb-primary-soft` |
| Selected + Hover | `--sqb-primary-soft`（加深 4%） |

- 行高：34px（紧凑）或 40px（宽松）
- 表头：font-weight 600，font-size xs(12px)，颜色 `--sqb-text-muted`，背景 `--sqb-bg-strong`
- 表头 sticky：`position: sticky; top: 0; z-index: 10`
- 分隔线：`border-bottom: 1px solid var(--sqb-border)`
- 数字列：`font-variant-numeric: tabular-nums`，右对齐

---

## 图标规范

**风格：** Outlined（描边），不使用 filled 填充图标，保持与学术/工具气质一致。

**推荐图标库：** Lucide（轻量、描边风格、MIT 协议）

| 尺寸 Token | px | 用途 |
|------------|-----|------|
| xs | 12px | 行内辅助图标、角标 |
| sm（默认）| 16px | 工具栏图标、按钮内图标 |
| md | 20px | 空状态插图、section 图标 |
| lg | 24px | 主导航、大型操作按钮 |

- **描边宽度：** 1.5px（保持细腻，与有机/学术气质匹配）
- **颜色继承：** `currentColor`，不硬编码颜色
- **图标与文字间距：** xs(4px)
- **禁止：** 对图标做拉伸变形，保持等比例

---

## 可访问性规范

### 焦点环（Focus Ring）

所有可交互元素必须有可见焦点状态：

```css
:focus-visible {
  outline: 2px solid var(--sqb-primary);
  outline-offset: 2px;
}
```

- 不使用 `outline: none`，除非同时提供自定义焦点样式
- 深色模式下焦点环颜色切换为深色模式的 `--sqb-primary`（`#6aab7e`）

### 对比度（WCAG AA 标准）

| 组合 | 比例 | 达标 |
|------|------|------|
| `--sqb-text` (#2e3230) on `--sqb-bg` (#faf6f0) | ≈ 13:1 | AA + AAA |
| `--sqb-text-muted` (#62685f) on `--sqb-bg` (#faf6f0) | ≈ 5.8:1 | AA |
| `#ffffff` on `--sqb-primary` (#4a7c59) | ≈ 4.6:1 | AA |
| `#ffffff` on `--sqb-danger` (#b83230) | ≈ 5.1:1 | AA |
| `--sqb-text-muted` on `--sqb-surface` | ≥ 4.5:1 | AA |

- 所有正文和 UI 标签必须达到 WCAG AA（4.5:1）
- 大号文字（18px+ 或 14px+ bold）可放宽至 3:1
- 深色模式同等要求，已通过降温降饱和保证对比度

### 减少动效

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Z-index 层级系统

| 层级名 | 值 | 元素 |
|--------|-----|------|
| base | 0 | 普通文档流元素 |
| raised | 1 | 卡片 box-shadow 提升 |
| sticky | 10 | 表格 sticky header、sticky sidebar header |
| sidebar | 20 | 侧边栏（折叠状态浮于内容上方） |
| dropdown | 100 | Select 下拉框、Popover、右键菜单 |
| tooltip | 200 | Tooltip |
| dialog | 300 | Modal、Dialog 弹层 |
| notification | 400 | Toast、全局通知 |

规则：
- 同层级元素不竞争 z-index，通过 DOM 顺序控制
- Dropdown 必须脱离普通文档流（`position: absolute` 或 `fixed`）
- Dialog 遮罩层使用 `z-index: 299`，内容层 `z-index: 300`

---

## 多视图设计规范

本插件提供四种结果视图，各有专属设计指导。

### 表格视图（Table View）

定位：数据密集型，最大化信息密度，适合结构化浏览和批量操作。

- **行高：** 默认 34px，可选宽松 40px（用户偏好）
- **列宽：** 块 ID 列固定 120px，内容列 flex-1，数值列固定 80px 右对齐
- **表头：** sticky，背景 `--sqb-bg-strong`，字号 xs(12px)，font-weight 600，颜色 `--sqb-text-muted`
- **空状态：** 居中图标（md 20px）+ 提示文字，颜色 `--sqb-text-muted`
- **属性回写列：** 状态/优先级/日期列提供行内编辑，hover 时显示编辑图标（xs 12px）
- **排序指示：** 表头右侧 chevron 图标，仅当前排序列可见（非 hover 时）

### 看板视图（Kanban View）

定位：以属性值（如状态、优先级）分组，卡片横向排列，适合进度跟踪和状态管理。

- **列宽：** 固定 220px，横向滚动
- **列标题：** 属性值名称 + badge（卡片数量），font-size sm(13px)，font-weight 600
- **列头背景：** `--sqb-bg-strong`，底部 2px border 颜色对应语义色（如完成=primary、待办=muted）
- **卡片：** `--sqb-surface` 背景，border-radius lg(12px)，1px `--sqb-border` 边框，padding md(16px)
- **卡片 hover：** `--sqb-surface-strong` 背景，border `--sqb-border-strong`，轻微上浮 `translateY(-1px)` + shadow
- **卡片内容：** 标题 sm(13px)，摘要文字 xs(12px) `--sqb-text-muted`，底部 meta 行（日期/优先级 badge）
- **空列：** 虚线边框 `--sqb-border`，文字「暂无内容」颜色 `--sqb-text-muted` opacity 0.5
- **列间距：** md(16px) gap

### 列表视图（List View）

定位：轻量线性浏览，聚焦内容本身，适合快速阅读和跳转。

- **行结构：** 左侧 block-type 图标（xs 12px `--sqb-text-muted`）+ 标题（sm 13px）+ 右侧 meta（日期/路径，xs 12px `--sqb-text-muted`）
- **行高：** 32px
- **行分隔：** `border-bottom: 1px solid var(--sqb-border)` opacity 0.5（最后一行无分隔）
- **hover：** 背景 `--sqb-bg-strong`，标题颜色变为 `--sqb-primary`
- **缩进层级：** 子块相对父块缩进 md(16px)，用 2px 左边框 `--sqb-primary-soft` 标记层级
- **标题截断：** 单行 `text-overflow: ellipsis`，鼠标悬停时 tooltip 显示全文

### 统计卡片视图（Stats View）

定位：聚合数据可视化，以 KPI 卡片形式展示查询结果的统计数据。

- **卡片布局：** 横向 flex 排列，每卡 min-width 120px，flex-wrap 换行
- **卡片结构：**
  - 上部：指标名称（2xs 11px，`--sqb-text-muted`，大写/tracking-wide）
  - 中部：数值（xl 22px，`--sqb-serif`，`--sqb-text`，tabular-nums）
  - 下部（可选）：变化趋势（↑↓箭头 + 百分比，xs 12px）
- **卡片背景：** `--sqb-surface`，border-radius lg(12px)，1px `--sqb-border`
- **主要指标卡片：** 左侧 3px solid `--sqb-primary` 左边框作为强调
- **数值颜色语义：** 正增长 `--sqb-primary`，负增长 `--sqb-danger`，中性 `--sqb-text`
- **空状态：** 卡片内显示「—」占位符，颜色 `--sqb-text-muted`

---

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
| 2026-03-22 | 新增 `--sqb-info-soft` token | 与其他语义色 -soft 变体对齐，补全 token 体系 |
| 2026-03-22 | 新增组件行为规范 | 定义按钮/输入框/badge/表格行的状态规则，消除实现歧义 |
| 2026-03-22 | 新增图标规范（Lucide，描边 1.5px）| 统一图标风格与学术气质匹配 |
| 2026-03-22 | 新增可访问性规范（焦点环、WCAG AA）| 确保键盘导航和对比度可用性 |
| 2026-03-22 | 新增 Z-index 层级系统 | 明确弹层堆叠顺序，防止 dropdown 与 dialog 竞争 |
| 2026-03-22 | 新增四种视图专属设计规范 | 表格/看板/列表/统计卡片各有差异化设计指导 |
| 2026-03-22 | 圆角体系扩展至 2xl(20)/3xl(24)/hero(28) | 现有代码已验证这些值视觉效果好，有机学术风适合柔和大圆角 |
| 2026-03-22 | 实现暗色模式 CSS（@media + .b3-theme-dark）| 设计 token 已定义，立即落地，避免设计与实现长期脱节 |
| 2026-03-22 | 新增 --sqb-mono / --sqb-info / --sqb-info-soft 到 index.scss | 补全 DESIGN.md 定义的 token 在代码中的声明 |
| 2026-03-22 | 新增 prefers-reduced-motion 规则到 index.scss | 可访问性基础要求，成本为零 |
| 2026-03-22 | SyButton/SyInput 等 SiyuanTheme 组件计划改写为 sqb-token 驱动 | 当前使用 b3-* 类依赖思源主题，违反「独立视觉身份」原则，已列入 Phase D |