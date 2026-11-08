# 重构计划(第二轮)

## 1. 项目快照

- 生成日期:2026-11-08
- 范围:`D:\MyCodingProjects\siyuan-query-builder`(全仓库)
- 目标:消除上一轮(RF-101~105)遗留的耦合不对称与复制粘贴漂移,修复已确认的日历过滤不一致缺陷,补齐测试盲区;不改变用户可见行为(除 RF-107 中明确记录的一处行为修复)
- 基线仓库状态:
  - `git status --short`:clean
  - `npm run test:run`:pass(43 个测试文件 / 212 个测试)
- 上一轮计划(2026-03-24,RF-101~105)已全部完成,本文件为新一轮计划
- 文档刷新目标:`docs/project-structure.md`、`README.md`

## 2. 架构与模块分析

| 模块 | 关键文件 | 当前职责 | 主要痛点 | 测试覆盖情况 |
| --- | --- | --- | --- | --- |
| Store dashboard 编排 | `src/composables/query-builder-store.ts`(L155-228) | `runActiveDashboard/loadDashboard/updateDashboardParam/closeDashboard/saveDashboardAsTemplate` + 三个 WithDashboard 包装 | RF-101 唯一遗留不对称:其他域已拆 controller,dashboard 编排仍内联在 facade;`saveDashboardAsTemplate` 跨域隐式写 template 域(清 activeDashboardId、切 advancedMode、复用 saveTemplate),副作用序列无测试保护 | store 级 dashboard 行为**零测试**;`tests/dashboard-runtime.test.ts` 仅覆盖 runtime 层 2 例 |
| 结果视图模型(面板/内联) | `QueryBuilderResults.vue`(L283-315)、`InlineQueryWidget.vue`(L199-231) | calendarTasks 映射、分组分布图 option 构造 | 两处**逐字重复**且已发生漂移:chart title fallback("统计图表" vs "分组统计图表");`writeClipboardText` 内嵌组件;`ResultsCalendarView.getDayTasks`(L210-217)与 `core/view/calendar.ts`(L45-51)的 `open` 过滤**双实现已漂移(deferred)**,是现行 bug | calendarTasks/chartOption/clipboard 零直接测试;inline 的 calendar/board/list/cards 视图零覆盖 |
| Dock 组件 | `src/components/query-builder/QueryBuilderDock.vue` | 工作台入口 + 场景仪表板/preset/模板/历史四区块 | `import { openXxx } from "@/main"` 形成环依赖,测试被迫全量 mock;`onMounted` 裸调 `plugin.loadData` 绕过 RF-101 存储工厂;`snapshot: any`/`as any[]` 重新解析存储形状;`getDashboardIcon` 与 Sidebar 逐字重复 | `tests/dock-view.test.ts` 仅 4 例,只覆盖 dashboard 区块;preset/template/history 渲染与点击、损坏数据路径无覆盖 |
| Dashboard catalog | `src/core/dashboard/catalog.ts`(670 行) | 5 个场景仪表板的参数定义 + buildSql + computeViewModel | 单数组字面量 670 行,5 个 computeViewModel 各 60-100 行内联;5 处重复的 rows 归一化断言(`Array.isArray(rawRows[0])`);`mappings` 死参数贯穿签名;模块加载时求值默认日期参数;参数全程 `Record<string, any>` | `dashboard-catalog.test.ts` 仅冒烟级(metrics/charts 数量);computeViewModel 分支(逾期/streak/分桶)零断言;runtime 数组 SQL 分支零测试 |
| 入口与打开路由 | `src/main.ts`(385 行) | 对话框/页签/dock 挂载 + 打开路由 + debug 日志 | `openWorkspaceWithDashboard/Preset/Template` 三胞胎重复;`activeWorkspaceStore: any` 与 store 双向隐式耦合;main 直调 store 与 App.vue 消费 `pendingWorkspaceTarget` 构成双通道时序竞争;`appendDebugLog` 读改写竞态 | `main-open-mode.test.ts` 未覆盖 preset/template 路由、pendingTarget 消费时序、destroy 生命周期 |
| API 边界 | `src/api.ts`(477 行) | 思源 HTTP API 包装 | 约 40 个导出中仅 9 个被使用,**约 31 个死函数**;`request()` 将 `code!==0` 吞成 null 语义集中性差;`getFile` 行为与其他函数不一致;`sql(): Promise<any[]>` | 无直接测试(仅被消费方 mock) |
| Editor 样式层 | `QueryBuilderEditor.vue`(636 行,其中 style 555 行) | 编辑器编排 + 四个子 section 的样式 | 约 420 行 `:deep()` 穿透到子组件内部类,类名改动静默失效无编译告警 | 17 个交互用例已锁定类名与行为,样式搬移有安全网 |
| 杂项一致性 | `shared.ts`、`selectors.ts`、`session-controller.ts`、`sidebar-utils.ts`、`tooltip.ts`、`calendar.ts` | 各自职责 | `shared.ts` 遗留死导出 `displayValue/resolveFieldLabel`;`scopeLabel` 与 `historyScopeLabel` 近似重复;`formatSidebarViewTypeLabel` 缺 `calendar/chart` 分支(摘要误显示"表格");tooltip `placement` 类型声明与实现不符;calendar.ts 三段 cell 构造重复 | 分支级缺口 |

## 3. 按优先级排序的重构待办

| ID | 优先级 | 模块/场景 | 涉及文件 | 重构目标 | 风险等级 | 重构前测试清单 | 文档影响 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RF-106 | P0 | Store dashboard 编排拆分 | `src/composables/query-builder-store.ts`、新建 `src/composables/query-builder-store/dashboard-controller.ts`、`tests/query-builder-store-views.test.ts`(或新建 dashboard store 测试文件) | 保持公开 store API 不变,将 dashboard 编排移入与 session/template 平级的 controller,依赖显式注入(`executeDashboard`、`getDashboardDefinition`、`templateViews.saveTemplate`) | 中 | - [ ] loadDashboard 重置参数并执行 executeDashboard;- [ ] updateDashboardParam 写入参数并触发重跑;- [ ] closeDashboard 清空 id 与 ViewModel;- [ ] saveDashboardAsTemplate 生成模板名/SQL/advancedMode 切换并调用 saveTemplate;- [ ] 三个 WithDashboard 包装先 closeDashboard 再委托的顺序不变 | `docs/project-structure.md`:controller 清单 +1;`README.md`:无用户可见变化 | done |
| RF-107 | P0 | 共享结果视图模型 + 日历过滤缺陷修复 | `QueryBuilderResults.vue`、`InlineQueryWidget.vue`、`ResultsCalendarView.vue`、`core/view/calendar.ts`、新建 `core/view/result-view-model.ts`、新建 `src/utils/clipboard.ts`、`tests/calendar-view.test.ts`、`tests/inline-widget.test.ts`、`tests/query-builder-results.test.ts`、新建 `tests/result-view-model.test.ts` | 提取 `buildCalendarTaskItems`/`buildGroupDistributionChartOption` 为共享纯函数(Results 与 InlineWidget 复用);`writeClipboardText` 迁入 utils;`addMonths` 下沉 calendar.ts;**行为修复**:popover 的 `open` 过滤与 grid 对齐(含 deferred),消除格子计数与明细不一致 | 低-中 | - [ ] buildCalendarTaskItems:markdown 任务前缀、日期字段回退(hpath/created);- [ ] buildGroupDistributionChartOption:cards<2 fallback、title 统一语义;- [ ] writeClipboardText 现代 API 与 execCommand fallback;- [ ] addMonths 跨年(12→1 月、1→12 月);- [ ] popover 与 grid 过滤一致(deferred 任务在 open 过滤下可见);- [ ] inline widget calendar/chart 视图渲染不变 | `docs/project-structure.md`:core/view 清单 +1、utils 清单 +1;`README.md`:行为修复可写入变更说明 | done |
| RF-108 | P1 | Dock 依赖反转 + 存储层复用 | `QueryBuilderDock.vue`、`QueryBuilderSidebar.vue`(仅 getDashboardIcon 去重)、新建 `src/components/query-builder/dashboard-icons.ts`、`tests/dock-view.test.ts` | 动作改为 props/inject 注入(解除对 `@/main` 的 import);数据加载改用 `createQueryTemplateStore/createQueryHistoryStore` 与既有类型;保持 history `slice(0, 8)` 展示语义与 v2 存储反序列化一致 | 中 | - [ ] 四类区块(preset/dashboard/template/history)渲染与点击分发不变;- [ ] 存储为空/损坏时列表为空不抛错;- [ ] 模板摘要(defaultViewType)展示不变;- [ ] getDashboardIcon 单一来源 | `docs/project-structure.md`:组件依赖关系描述;`README.md`:无 | done |
| RF-109 | P1 | Dashboard catalog 拆分 | `src/core/dashboard/catalog.ts` → 5 个场景文件 + index 聚合、`src/core/dashboard/runtime.ts`(rows 归一上移)、`tests/dashboard-catalog.test.ts`、`tests/dashboard-runtime.test.ts` | 先补 computeViewModel 分支测试再拆;提取 `normalizeRows` 消除 5 处重复断言;删除 `mappings` 死参数;SQL 字符串拼接行为保持逐字不变(参数化不在本轮) | 中-高 | - [ ] 每个场景 computeViewModel 的关键分支(逾期/达标率/优先级分桶/状态中英匹配);- [ ] 空 rows 与字段缺失回退;- [ ] runtime 数组 SQL 分支归一后行为不变;- [ ] 5 个场景 SQL 输出与拆分前逐字一致 | `docs/project-structure.md`:core/dashboard 文件清单;`README.md`:无 | done |
| RF-110 | P1 | main.ts 打开路由统一 | `src/main.ts`、`src/App.vue`(pendingTarget 消费侧)、`tests/main-open-mode.test.ts` | 三胞胎打开函数合并为单一入口(差异参数化);`activeWorkspaceStore: any` 收窄为最小接口;保持 dialog 模式直调 store 与 tab 模式 pendingTarget 消费两条实际生效路径行为等价 | 中-高 | - [ ] openWorkspaceWithDashboard/Preset/Template 对 pendingTarget 的写入字段不变;- [ ] store 已就绪时直调生效、未就绪时 pendingTarget 仍被 App.vue 消费;- [ ] dialog/tab 两种模式打开结果不变;- [ ] destroy 后再次 init 幂等 | `docs/project-structure.md`:入口/生命周期描述;`README.md`:无 | done |
| RF-111 | P2 | api.ts 瘦身 | `src/api.ts`、新建 `tests/api-boundary.test.ts` | 删除约 31 个未使用导出;`sql()` 返回类型收紧为 `Record<string, unknown>[]`;`code!==0 → null` 语义集中注释并统一 `getFile`;消费方(kernel-adapter/session/embed/inline-service)全部核对 | 低 | - [ ] 保留的 9 个函数请求路径与返回形状不变;- [ ] code!==0 → null 语义有直接测试;- [ ] getBlockByID 空结果行为不变 | `docs/project-structure.md`:api.ts 职责描述;`README.md`:无 | done |
| RF-112 | P2 | Editor 样式归还子组件 | `QueryBuilderEditor.vue`、`EditorFiltersSection/EditorScopeSection/EditorMappingsSection/EditorViewSettingsSection/EditorFieldPicker`、新建共享样式 partial | 将约 420 行 `:deep()` 规则迁移到各自子组件 scoped style;公共 control/btn/field/section-head 进共享层;选择器特异性保持 | 低 | - [ ] 现有 17 个 editor 交互用例全绿(类名锁定);- [ ] 构建产物中样式规则数量不减少;- [ ] 编辑器四区块视觉布局不变(网格 span) | `docs/project-structure.md`:样式层描述;`README.md`:无 | done |
| RF-113 | P2 | 死代码与一致性清理 | `composables/query-builder-store/shared.ts`、`selectors.ts`、`session-controller.ts`、`sidebar-utils.ts`、`tests/query-builder-sidebar.test.ts`、`tests/tooltip.test.ts` | 删除 `shared.ts` 死导出 `displayValue/resolveFieldLabel`;`scopeLabel` 与 `historyScopeLabel` 合并为 shared 纯函数;`formatSidebarViewTypeLabel` 补 `calendar/chart` 分支(缺陷修复);tooltip `placement` 类型收窄为 `"top" \| "bottom"` | 低 | - [ ] 清理后全量测试通过;- [ ] 模板摘要对 calendar/chart 显示正确标签;- [ ] scopeLabel 两种文案语义保持(selectors 与 history 各自原样) | `docs/project-structure.md`:微调;`README.md`:无 | done |

优先级说明:
- `P0`:价值和风险都最高,优先执行(RF-106 补齐 RF-101 不对称、RF-107 修复现行缺陷并消除复制漂移)
- `P1`:中等价值或中等风险,放在 P0 之后
- `P2`:低风险清理与一致性,最后执行

状态说明:`pending` / `in_progress` / `done` / `blocked`

延后项(本轮不执行,记录原因):
- CollapsibleSection 通用折叠组件提取:涉及 10 处调用点与多个测试锚点(`data-section-toggle` 等),收益为模板去重,风险/工作量比偏高,建议单独立项
- Dashboard SQL 参数化:行为变更(非重构),需单独评估
- dirty 跟踪 JSON.stringify 性能优化:需要性能数据支撑,暂无用户反馈

## 4. 执行日志

| ID | 开始日期 | 结束日期 | 验证命令 | 结果 | 备注 |
| --- | --- | --- | --- | --- | --- |
| BASELINE | 2026-11-08 | 2026-11-08 | `npm run test:run` | pass | 基线:43 个测试文件 / 212 个测试全部通过,工作区 clean |
| RF-106 | 2026-11-08 | 2026-11-08 | `npx vitest run tests/query-builder-store-dashboard.test.ts tests/query-builder-store-views.test.ts`;`npm run test:run` | pass | 新建 `dashboard-controller.ts`,facade 仅保留三个 WithDashboard 组装函数;新增 13 个 store 级 dashboard 回归测试(loadDashboard 参数重置/updateDashboardParam 重跑/失败兜底/saveDashboardAsTemplate 字符串与数组 SQL 分支/applySnapshot·loadTemplate·resetDraft 先关仪表板顺序);44 文件 / 225 测试全绿。注:eslint.config.mjs 引用的 `src/utils/eslint/i18n-validate-keys.mjs` 在仓库中缺失(既有问题,与本次无关) |
| RF-107 | 2026-11-08 | 2026-11-08 | `npx vitest run tests/result-view-model.test.ts tests/clipboard.test.ts tests/calendar-view.test.ts tests/inline-widget.test.ts tests/query-builder-results.test.ts`;`npm run test:run`;`npx vite build` | pass | 新建 `core/view/result-view-model.ts`(buildCalendarTaskItems/buildGroupDistributionChartOption)与 `utils/clipboard.ts`;Results 与 InlineQueryWidget 改用共享函数;calendar.ts 新增 filterCalendarTasks(网格复用)与 addMonths;**行为修复**:日历 "+N" 弹窗明细与网格共用过滤规则,deferred 任务在"未完成"过滤下可见(修复前弹窗缺 deferred);**title 统一**:分组图标题统一为 `${title} - 分组统计`(有标题)/"统计图表"(无标题),Results 无名分组态与 Inline 有名回退态随之变化(仅图表标题文案);新增 18 个测试(result-view-model 8/clipboard 3/calendar 4+popover 组件 1/inline calendar 1+2 既有);46 文件 / 243 测试全绿,构建通过 |
| RF-108 | 2026-11-08 | 2026-11-08 | `npx vitest run tests/dock-view.test.ts tests/query-builder-sidebar.test.ts tests/main-open-mode.test.ts tests/plugin-index-settings.test.ts`;`npm run test:run`;`npx vite build` | pass | 新建 `ui/workspace-navigation.ts`(InjectionKey + useWorkspaceNavigation)与 `components/query-builder/dashboard-icons.ts`;Dock 的四个打开动作改为 inject 注入(main.ts mountDock 提供),数据加载改用 createQueryTemplateStore/createQueryHistoryStore(损坏数据安全返回空列表),`snapshot: any`/`as any[]` 换成 QueryTemplate/QueryHistoryEntry 类型;Sidebar/Dock 共用 getDashboardIcon。注:Dock 仍保留 usePlugin 来自 @/main(与 store 等组件一致),动作 import 已解除。dock 测试 4→8(新增 preset/template/history 点击与损坏存储用例);47 文件 / 247 测试全绿,构建通过 |
| RF-109 | 2026-11-08 | 2026-11-08 | `npx vitest run tests/dashboard-scenarios.test.ts tests/dashboard-runtime.test.ts tests/dashboard-catalog.test.ts tests/dashboard-calculator.test.ts tests/dashboard-integration.test.ts tests/query-builder-store-dashboard.test.ts tests/dock-view.test.ts tests/main-open-mode.test.ts`;`npm run test:run`;`npx vite build` | pass | catalog.ts(670 行)拆为 `core/dashboard/scenarios/` 下 5 个场景文件(各带 per-scenario 参数接口:DailyCockpitParams 等,经接口方法式声明消除防御强转)+ 聚合入口;提取 runtime 层 rows 归一(数组 SQL 结果 flatten 后传给 computeViewModel),删除 5 处重复的 `Array.isArray(rawRows[0])` 断言;删除 buildSql/computeViewModel 的 mappings 死参数与 runtime 默认 mappings 死代码;DashboardDefinition.computeViewModel 签名收紧为 `rows: ResultRow[]`(原 `ResultRow[] \| ResultRow[][]`)。**语义注记**:数组 SQL 多查询时 computeViewModel 收到全部结果拼接(原为仅第一组),5 个现有场景均不使用数组 SQL,生产不可观测。新增 tests/dashboard-scenarios.test.ts(12 个分支用例:指标卡/状态分桶中英双语/优先级/饼图零值过滤/hpath 日期回退/SQL 子句)+ runtime 数组分支用例;48 文件 / 260 测试全绿,构建通过。**遗留**:模块加载时求值的 defaultValue(formatIsoDate(new Date()) 等)保持原样,未改为惰性取值(行为变化,不在本轮范围) |
| RF-110 | 2026-11-08 | 2026-11-08 | `npx vitest run tests/main-open-mode.test.ts tests/plugin-index-settings.test.ts tests/dock-view.test.ts`;`npm run test:run`;`npx vite build` | pass | main.ts 打开路由三胞胎合并为 `openWorkspaceToTarget` 单一入口(pendingTarget 写入 → openPanel → store 直调兜底,顺序与原实现逐项一致);`activeWorkspaceStore: any` 收窄为最小接口 `ActiveWorkspaceStoreRef`(activeDashboardId/loadDashboard/applySnapshot/loadTemplate/runActiveDashboard);workspace/仪表板两类 addTab 生命周期回调合并为 `createTabHostHandlers`;destroy() 补清 pendingWorkspaceTarget(修复销毁后遗留目标被下次挂载误消费的隐患)。新增 6 个路由测试(preset 经 pendingTarget+store 双通道/未就绪时仅 pendingTarget/template 等待 loadTemplate/空 dashboardId 不写 pendingTarget/dashboard dialog 路由/destroy 清理与重复 init);49 文件 / 266 测试全绿,构建通过 |
| RF-111 | 2026-11-08 | 2026-11-08 | `npx vitest run tests/api-boundary.test.ts tests/runtime.test.ts tests/query-builder-store-views.test.ts tests/inline-service.test.ts tests/embed-target.test.ts tests/inline-embed.test.ts`;`npm run test:run`;`npx vite build` | pass | api.ts 477 → 115 行:按 import 分析确认实际使用面仅 9 个函数(lsNotebooks/getNotebookConf/createDocWithMd/getChildBlocks/setBlockAttrs/appendBlock/sql/getBlockByID/renderSprig),删除 35 个死导出;`sql()` 返回类型收紧为 `Promise<Record<string, unknown>[]>`(与 KernelAdapter 声明对齐);`getBlockByID` 修复内核错误(code!==0 → null)时的 TypeError(改为 null 安全返回 undefined);文件头补统一错误语义注释。新建 tests/api-boundary.test.ts(5 用例:成功数据/code!==0→null/sql 语句载荷/getBlockByID 空结果与错误安全/载荷正确性);src/types/api.d.ts 全局命名空间类型保留未动(ambient 声明不影响产物);50 文件 / 271 测试全绿,构建通过 |
| RF-112 | 2026-11-08 | 2026-11-08 | `npx vitest run tests/query-builder-editor.test.ts tests/query-builder-store-views.test.ts`;`npm run test:run`;`npx vite build` + dist CSS 选择器抽查 | pass | QueryBuilderEditor.vue style 555 → 约 100 行:约 420 行 `:deep()` 规则迁移为共享 partial `editor-shared.scss`(section-head/actions/toggle/stack/h3/control/btn/muted/form-grid/field 系)与 `editor-filter-row.scss`(filter-row 系),由四个分区组件与 FieldPicker 的 scoped style `@use` 引入;**级联等价处理**:经逐类核查,父级 :deep 与子组件自有规则此前以同等特异性竞争且父级后注入生效,故 ViewSettings/FieldPicker 中被遮蔽的自有声明(约 150 行,含 section-head/h3/toggle/control/btn/form-grid/field/filter-row 及 900px 媒体查询中 form-grid 分支、FieldPicker 媒体 align-items 分支)按"今日生效值"原则移除,分区独有规则(view-config-panel 系、form-grid--top、toggle hover 的 color/border、field-picker 系、媒体断点)保留;**死规则清理**(此前选择器不匹配任何元素):父级 .eyebrow/.chip 系/.title-input 系/.field-picker 系/.view-config-row/.view-config-panel、720px 媒体查询整块、`.check small` 分支。**清单偏差注记**:"规则数量不减少"调整为"活规则不减少"——经 dist CSS 抽查确认 filter-row/section-toggle/btn--ghost/form-grid/field-picker__toggle/view-config-row/card 等选择器均以正确 scope 属性存在;51 文件 / 271 测试全绿,构建通过 |
| RF-113 | 2026-11-08 | 2026-11-08 | `npx vitest run tests/query-builder-sidebar.test.ts tests/tooltip.test.ts tests/query-builder-store-views.test.ts tests/query-builder-results.test.ts`;`npm run test:run`;`npx vite build` | pass | 删除 shared.ts 死导出 displayValue/resolveFieldLabel(RF-104 迁移 presentation 后遗留的 re-export shim)及其孤儿接口(顺带修正 tests/result-display.test.ts 对该 shim 的引用,改指真实实现 formatResultValue,提交前全量测试捕获);新增 shared.buildScopeLabel(scopeType, variant) 合并 selectors.scopeLabel 与 session-controller.historyScopeLabel 的双写 switch,两处文案语义逐字保持(editor:"文档 ID/属性键/范围值";history:"文档/属性/全部内容");formatSidebarViewTypeLabel 补 calendar→"月历"、chart→"图表" 分支(**行为修复**:此前保存为月历/图表视图的模板摘要误显示"表格",标签与 Results 切换器文案对齐);tooltip.ts TooltipOptions.placement 收窄为 "top" \| "bottom" 与 showTooltip 实现一致(实现本就只处理上下方向)。新增 2 个标签分支用例;52 文件 / 273 测试全绿,构建通过。注:`npx vue-tsc --noEmit` 因仓库 tsconfig 与新版 TS 的弃用配置冲突(TS5101/TS5107)无法运行,类型层面验证依赖构建与测试 |
| FINAL | 2026-11-08 | 2026-11-08 | `npm run test:run`;`npx vite build` | pass | 全部 8 项完成后的最终验证:52 个测试文件 / 273 个测试全绿(基线 43/212),生产构建通过;文档刷新完成并写回本计划 |

## 5. 决策与确认

- 用户批准的条目:RF-106、RF-107、RF-108、RF-109、RF-110、RF-111、RF-112、RF-113(全部 8 项,2026-11-08 批准)
- 延后的条目:CollapsibleSection 提取、SQL 参数化、dirty 性能优化(见第 3 节)
- 阻塞条目及原因:(无)

## 6. 文档刷新

- `docs/project-structure.md`:已于全部条目完成后整体重写——补齐 dashboard-controller/scenarios/selectors/draft-actions/session-controller、core/dashboard 与 core/view 新文件、ui/workspace-navigation、editor 共享样式层、api.ts 瘦身说明;测试清单补齐本轮新增的 8 个测试文件;Current Refactor Notes 记录 RF-106~113 全部成果
- `README.md`:结果视图从"四种"修正为"六种"(补月历/图表条目与操作流程步骤 3);新增"场景仪表板与工作台"章节(5 个场景与打开方式、另存为模板能力);新增"开发与测试"章节(pnpm 命令与两份文档链接);RF-107 的日历弹窗修复与 RF-113 的标签修复已随章节内容自然覆盖
- 最终同步检查:2026-11-08 完成,两份文档更新情况已写回本文件;最终验证 `npm run test:run` 52 文件 / 273 测试全绿 + `npx vite build` 通过(见第 4 节 FINAL 行)

## 7. 下一步

1. 用户按条目 ID 批准执行范围
2. 按 P0 → P1 → P2 顺序逐项执行(测试先行:先补测试 → 定向跑 → 重构 → 定向跑 → 全量跑)
3. 每项完成即更新本计划状态,全部完成后刷新两份文档并做最终汇报
