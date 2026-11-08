# Project Structure

## Overview

`siyuan-query-builder` 是一个面向思源笔记的可视化查询构建器插件。当前结构按“入口装配 -> 查询与存储核心 -> 场景仪表板 -> UI 分区组件 -> 行内渲染”组织,把状态编排、领域计算与大型 UI 区块拆成更小的边界;UI 组件普遍只做编排,领域逻辑下沉到 `src/core/` 纯函数层。

## Root

| 路径 | 说明 |
| --- | --- |
| `src/` | 插件源代码 |
| `tests/` | Vitest 测试,按功能域镜像源码(52 个文件) |
| `docs/` | 产品、设计、重构和结构文档 |
| `developer_docs/` | 开发参考资料(本机参考,不入库) |
| `dist/` | 构建产物 |
| `plugin-sample-vite-vue/` | 上游示例,不是当前主要实现目录 |

## Source Layout

### `src/index.ts`
- 插件入口:思源插件生命周期、顶栏图标、命令注册、面板/行内渲染器启动与销毁。

### `src/main.ts`
- Dialog/页签/Dock 三种挂载生命周期与主题联动。
- 打开路由统一入口 `openWorkspaceToTarget`(preset/dashboard/template 三类目标经 `pendingWorkspaceTarget` 双通道分发)。
- `mountDock` 通过 `workspaceNavigationKey` 向 Dock 注入导航动作,避免组件直连 `@/main`。
- 面板级错误兜底与运行时错误持久化;`destroy()` 清理挂载与遗留的 pending 目标。

### `src/composables/query-builder-store.ts`
- 查询构建器主 store 的装配入口:组合下列子控制器,经 `proxyRefs` 暴露稳定 UI 接口。

### `src/composables/query-builder-store/`
- `shared.ts` — store 共享常量与纯 helper(草稿创建、快照生成、范围文案 `buildScopeLabel`、字段选项合并、可编辑字段判断等)。
- `selectors.ts` — 派生只读视图(结果字段、卡片/列表汇总、分组代理、校验问题等)。
- `draft-actions.ts` — 草稿变更动作(增删条件/排序/自定义字段、切换视图类型)。
- `session-controller.ts` — 初始化装配、查询历史、示例文档生成、快照应用。
- `query-execution-controller.ts` — 查询执行、副作用提示、快速回写、嵌入块插入、看板拖拽写回。
- `embed-target-controller.ts` — 当前文档识别、最近嵌入目标、提示文案与目标持久化。
- `template-view-controller/` — 模板/视图持久化(加载、另存、默认视图切换、删除、迁移就绪)。
- `dashboard-controller.ts` — 仪表板编排:加载/参数更新/关闭/另存为模板,依赖显式注入。

### `src/core/`
- `query/` — 查询领域模型、SQL 编译、校验、默认字段/视图/预置场景定义。
- `runtime/` — 查询运行时与内核适配层(`kernel-adapter.ts` 汇聚 `@/api` 的 sql/块操作)。
- `storage/` — 模板、视图、指标、历史与迁移存储;`collection-storage.ts` 提供带损坏防御的数组持久化 helper。
- `dashboard/`
  - `catalog.ts` — 聚合 5 个场景仪表板并暴露 `getDashboardDefinition` 与参数默认值解析 `resolveDashboardParamDefault`。
  - `scenarios/` — 每个场景一个文件(daily-cockpit/habit-tracker/kb-health/writing-flow/project-delivery),各自带参数接口、`buildSql` 与 `computeViewModel`;时间相关默认参数(月份/年份)为惰性函数。
  - `runtime.ts` — 执行管道(构建 SQL → 内核查询 → rows 归一 → 视图模型)。
  - `calculator.ts` — 纯日期/统计函数(streak、MA7、星期聚合、状态/日期解析、SQL 字面量转义 `escapeSqlLiteral`)。
- `view/`
  - `chart.ts` — ECharts 运行时加载器与图表 option 构造。
  - `calendar.ts` — 月历网格、共享状态过滤 `filterCalendarTasks`、`addMonths`。
  - `result-view-model.ts` — 面板与内联共享的任务条目/分组分布图构建规则。
  - `board.ts` / `presentation.ts` / `preview-text.ts` — 看板列、跨表面展示规则。
- `embed.ts` / `embed-target.ts` — 嵌入块 payload 与目标识别/格式化辅助。
- `plugin-settings.ts` — 打开方式等插件设置。

### `src/components/query-builder/`
- `QueryBuilderSidebar.vue` / `sidebar-utils.ts` — 模板列表、预设分组、导入导出与历史恢复;文件 API 与格式化逻辑集中在 utils。
- `QueryBuilderEditor.vue` — 编辑区编排(校验提示 + 12 列网格 + 卡片跨度)。
- `EditorScopeSection.vue` / `EditorMappingsSection.vue` / `EditorFiltersSection.vue` / `EditorViewSettingsSection.vue` — 四个编辑分区;`EditorFieldPicker.vue` 输出字段多选。
- `editor-shared.scss` / `editor-filter-row.scss` — 分区共享版式与筛选行样式(由分区 scoped style 引入)。
- `dashboard-icons.ts` — 仪表板图标单一映射(Sidebar/Dock 共用)。
- `QueryBuilderDock.vue` — 侧边栏停靠面板(仪表板/预置/模板/历史四区块),数据经存储工厂读取、动作经注入消费。
- `QueryBuilderResults.vue` — 结果区编排与视图切换器。
- `ResultsTableView/BoardView/ListView/CardsView/CalendarView/ChartView.vue` — 各结果视图。
- `ResultsSavedViewsPanel.vue` / `ResultsEmbedPanel.vue` / `ResultsSqlPreview.vue` / `DashboardTuningBar.vue` / `DashboardView.vue` / `DeleteIconButton.vue`。
- `editor-state.ts` — 编辑区折叠状态、筛选拖拽与操作符归一逻辑。

### `src/inline/`
- 行内渲染器、扫描控制器、视图模型与 `InlineQueryWidget.vue`(与结果面板共享 presentation 与 result-view-model 规则)。

### `src/ui/`
- `theme.ts` / `host-root-styles.ts` / `shell-layers.ts` — 宿主主题探测、样式注入与 shell 层。
- `tooltip.ts` — 全局 tooltip 指令(上下两个方向)。
- `workspace-navigation.ts` — 工作台导航动作的注入契约(InjectionKey + `useWorkspaceNavigation`)。

### `src/i18n/`
- `zh_CN.json`、`en_US.json` 语言包。

### `src/api.ts`
- 思源内核 HTTP API 边界,仅保留实际使用的 9 个函数;统一错误语义:内核 `code !== 0` 时解析为 `null`,调用方以空值兜底。类型声明在 `src/types/api.d.ts`。

## Test Layout

| 测试文件 | 主要覆盖 |
| --- | --- |
| `tests/query-builder-store-views.test.ts` | store 模板/视图管理、嵌入目标、快速回写、错误分支和指标记录 |
| `tests/query-builder-store-dashboard.test.ts` | store 级仪表板编排(加载/参数/关闭/另存为模板/关闭顺序) |
| `tests/dashboard-scenarios.test.ts` | 5 个场景 computeViewModel 分支与 SQL 子句 |
| `tests/dashboard-runtime.test.ts` | 执行管道、数组 SQL 归一、未知定义报错 |
| `tests/dashboard-calculator.test.ts` | 日期/统计纯函数(含 streak 边界) |
| `tests/api-boundary.test.ts` | 内核 API 边界(成功载荷、错误语义、getBlockByID 空值安全) |
| `tests/main-open-mode.test.ts` | 打开路由、pendingTarget 双通道、destroy 清理与重复 init |
| `tests/dock-view.test.ts` | Dock 四区块渲染与导航动作分发、损坏存储防御 |
| `tests/query-builder-results.test.ts` | 结果区视图切换、已保存视图、嵌入目标菜单、空态 |
| `tests/query-builder-editor.test.ts` | 编辑区折叠、聚合配置、字段选择器、拖拽、校验提示 |
| `tests/result-view-model.test.ts` | calendarTasks 与分组分布图的共享构建规则 |
| `tests/calendar-view.test.ts` | 月历网格、共享状态过滤、addMonths、popover 一致性 |
| `tests/result-display.test.ts` / `result-presentation.test.ts` | 展示格式化与跨表面 presentation 规则 |
| `tests/clipboard.test.ts` | 剪贴板工具(API 优先、execCommand 回退) |
| `tests/query-template-store.test.ts` / `view-config-store.test.ts` / `query-template-store` | 存储顺序、默认视图互斥、删除行为 |
| `tests/query-compiler.test.ts` / `query-validation.test.ts` / `runtime.test.ts` | SQL 编译、校验规则、查询执行 |
| `tests/inline-*.test.ts` | 行内渲染、视图模型、嵌入与组件各视图 |
| `tests/theme-sync.test.ts` / `tooltip.test.ts` / `shell-layer.test.ts` / `host-root-style.test.ts` / `css-tokens.test.ts` | 宿主样式与 shell 层防回归 |

## Current Refactor Notes

- 2026-11 第二轮重构(RF-106~113,详见 `docs/refactor-plan.md`):
  - store 的仪表板编排拆入 `dashboard-controller`,store 级仪表板行为有回归测试保护。
  - 面板与内联共享的结果视图模型收敛到 `core/view/result-view-model.ts`;月历弹窗与网格共用 `filterCalendarTasks`(修复 deferred 过滤不一致)。
  - Dock 改为注入导航动作 + 存储工厂读取,不再直连 `@/main` 与裸存储。
  - 仪表板 catalog 拆为 5 个场景文件,rows 归一上移到 runtime,删除 mappings 死参数。
  - `main.ts` 打开路由三胞胎合并,workspace store 依赖收窄为最小接口,destroy 补清 pending 目标。
  - `api.ts` 瘦身至实际使用面(9 个函数),`sql()` 类型收紧,`getBlockByID` 空值安全。
  - 编辑器 `:deep()` 样式迁移为共享 partial 并归还各分区,死样式规则清理。
  - `scopeLabel`/`historyScopeLabel` 合并为 `buildScopeLabel`;侧边栏标签补月历/图表分支;tooltip 方向类型收窄。

- 2026-11 第三轮(遗留项,RF-114~118,详见 `docs/refactor-plan.md`):
  - 恢复类型检查门禁:tsconfig 现代化(bundler 解析、lib ES2022),`npm run typecheck` 全绿;修复 KernelAdapter 导入、DataType 声明、dock 回调签名等真实缺陷。
  - 恢复 ESLint:清理失效的插件引用与非法规则选项,全量风格归一,`npm run lint` 0 error。
  - 时间相关仪表板默认参数改为惰性求值(跨日/跨年不再过期);dirty 比较每次变更只做 1 次 stringify;场景 SQL 参数单引号转义(`escapeSqlLiteral`)。
