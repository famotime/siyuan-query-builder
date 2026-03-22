# siyuan-query-builder PRD Gap 执行计划

更新时间：2026-03-22

关联文档：

- [PRD 原文](./思源易搭_siyuan-query-builder_PRD.md)
- [PRD Gap 分析与后续开发指引](./siyuan-query-builder-prd-gap-analysis.md)
- [现有开发计划](./siyuan-query-builder-dev-plan.md)

## 当前执行状态

截至 2026-03-22，本计划中用于 PRD MVP 收口的任务已完成：

- Phase A：A1 / A2 / A3 已完成
- Phase B：B1 / B2 / B3 已完成
- Phase C：C1 / C2 已完成

当前 Definition of Done 已满足：

- 运行前校验可见且阻断错误配置
- 模板与视图存储已解耦并完成 v1 -> v2 迁移
- 同模板支持多个持久化视图，并可设置/恢复默认视图
- 侧边栏已展示模板默认视图与视图数量
- 已落地本地指标采集
- 关键链路测试与构建均稳定通过

后续若继续开发，建议只进入 Phase D / PRD Phase 2 扩展项，例如日历视图、时间线视图和更多预设模板。

## 1. 目标

本计划将 PRD gap 转换为可执行开发任务，目标是：

- 补齐当前 MVP 剩余缺口
- 为后续多视图扩展建立正确的数据结构
- 降低继续扩展功能时的返工风险

执行优先级遵循：

1. 先补体验和校验缺口
2. 再修正存储与模型结构
3. 最后做产品化和扩展能力

## 2. 建议实施阶段

## Phase A：MVP 收口

目标：

- 增加前置校验
- 补齐默认视图行为
- 明确视图使用限制

对应 PRD：

- 条件冲突/字段缺失提示
- 保存默认视图
- 支持最少配置生成可用界面

建议工期：

- 1 到 2 个开发日

## Phase B：结构修正

目标：

- 将 QueryTemplate 和 ViewConfig 真正解耦
- 支持同模板多视图配置
- 完成存储迁移

对应 PRD：

- 查询与视图解耦
- 视图配置可复用
- 用户可以保存视图偏好

建议工期：

- 2 到 4 个开发日

## Phase C：产品化补强

目标：

- 增加基础指标采集
- 增加更多回归测试
- 补运行期诊断

建议工期：

- 1 到 2 个开发日

## Phase D：Phase 2 能力扩展

目标：

- 日历视图
- 时间线视图
- 更多预设模板

说明：

- 不建议在 Phase A 和 B 完成前启动

## 3. 任务拆分

## Task A1：新增草稿校验模块

### 目标

在运行查询前，对当前 `draft` 进行结构化校验，并输出 `error / warning` 两级结果。

### 建议新增文件

- `src/core/query/validation.ts`

### 建议暴露接口

```ts
export interface ValidationIssue {
  level: 'error' | 'warning'
  code: string
  message: string
  field?: string
}

export function validateSnapshot(snapshot: QueryBuilderSnapshot): ValidationIssue[]
```

### 最低校验项

- `scope.type !== all_blocks` 时缺少 `scope.value`
- `date_between` 的起止日期不完整
- 聚合函数需要统计字段但未填写
- `limit` 非法
- `board` 视图缺少 `groupBy`
- `board` 视图分组字段不是状态字段时给 warning
- 快速编辑依赖字段映射为空时给 warning

### 影响文件

- `src/composables/query-builder-store.ts`
- `src/components/query-builder/QueryBuilderEditor.vue`
- `src/components/query-builder/QueryBuilderResults.vue`

### 实施建议

1. 在 store 中增加 `validationIssues` 计算属性
2. 增加 `hasBlockingIssues`
3. `runQuery` 前先检查 `hasBlockingIssues`
4. 编辑器顶部渲染统一提示区

### 测试建议

新增：

- `tests/query-validation.test.ts`

测试点：

- 缺失 scope value
- 不完整日期区间
- board 缺少分组
- 聚合配置不完整
- warning 与 error 的区分

### 验收标准

- 非法配置无法执行查询
- 用户在点击运行前就能看到明确提示
- warning 不阻塞运行

## Task A2：补齐默认视图的过渡实现

### 目标

在正式拆分存储前，先把“模板保存后恢复上次视图类型”做成可用能力。

### 现状

当前 `QueryBuilderSnapshot` 已保存 view，但没有清晰的“默认视图”交互和文案。

### 影响文件

- `src/core/query/types.ts`
- `src/composables/query-builder-store.ts`
- `src/components/query-builder/QueryBuilderResults.vue`
- `src/components/query-builder/QueryBuilderSidebar.vue`

### 实施建议

1. 在结果面板增加“设为默认视图”或“保存当前视图”入口
2. 模板加载时明确优先恢复 `snapshot.view.type`
3. 在模板列表文案中展示默认视图类型

### 测试建议

新增或扩展：

- `tests/query-builder-results.test.ts`
- `tests/template-store.test.ts`

### 验收标准

- 保存模板后重新加载，视图类型保持一致
- 用户能感知当前模板的默认展示视图

## Task A3：补齐看板拖拽的显式能力提示

### 目标

让用户在进入看板前就知道当前配置是否支持拖拽回写。

### 影响文件

- `src/composables/query-builder-store.ts`
- `src/components/query-builder/QueryBuilderResults.vue`

### 实施建议

增加一个计算属性，例如：

```ts
boardDragCapability: {
  enabled: boolean
  reason: string
}
```

建议逻辑：

- 非 board 视图：不展示
- board + groupBy 为状态属性：可拖拽
- board + groupBy 非状态属性：展示说明“仅按状态分组时支持拖拽回写”

### 测试建议

- 扩展 `tests/query-builder-results.test.ts`

### 验收标准

- 用户无需实际拖拽就能知道限制
- 文案与实际行为一致

## Task B1：拆分模板与视图存储

### 目标

将当前 `snapshot` 存储升级为模板与视图分别存储。

### 建议新增文件

- `src/core/storage/query-template-store.ts`
- `src/core/storage/view-config-store.ts`
- `src/core/storage/migrations.ts`

### 建议数据结构

```ts
interface StoredTemplateRecord {
  template: QueryTemplate
}

interface StoredViewRecord {
  view: ViewConfig
}
```

### 建议存储键

- `query-builder.templates.v2`
- `query-builder.views.v2`

### 影响文件

- `src/core/query/types.ts`
- `src/composables/query-builder-store.ts`
- `src/core/storage/template-store.ts`

### 实施建议

1. 保留旧 `template-store.ts` 作为兼容层或废弃入口
2. 新增 v2 store
3. store 初始化时检测旧数据
4. 自动迁移旧 snapshot 到新结构

### 迁移建议

旧：

- `QueryBuilderSnapshot[]`

新：

- `QueryTemplate[]`
- `ViewConfig[]`

迁移规则：

1. 从每个 snapshot 中抽出 template
2. 从 snapshot 中抽出 view
3. 若多个 snapshot 引用同一 template id，则保留去重后的 template
4. 同模板多个 view 允许共存

### 测试建议

新增：

- `tests/query-template-store.test.ts`
- `tests/view-config-store.test.ts`
- `tests/storage-migrations.test.ts`

### 验收标准

- 老数据升级后仍可正常使用
- 模板和视图可独立增删改查
- 不发生数据丢失

## Task B2：支持同模板多视图配置

### 目标

实现一个查询模板对应多个 ViewConfig。

### UI 目标

- 一个模板下可以有多个已保存视图
- 支持切换、另存为、删除视图
- 支持设置默认视图

### 影响文件

- `src/composables/query-builder-store.ts`
- `src/components/query-builder/QueryBuilderSidebar.vue`
- `src/components/query-builder/QueryBuilderResults.vue`

### 实施建议

在 store 中增加下面概念：

- `currentTemplateId`
- `savedViews`
- `currentViewId`

建议新增行为：

- `saveCurrentView()`
- `saveViewAs()`
- `loadView(viewId)`
- `deleteView(viewId)`
- `setDefaultView(viewId)`

### UI 草案

侧边栏中的“已保存模板”下可展示：

- 模板名
- 默认视图类型
- 视图数量

选中模板后，结果区域上方展示：

- 当前视图名
- 另存为视图
- 设置默认视图
- 删除视图

### 测试建议

新增：

- `tests/query-builder-store-views.test.ts`

扩展：

- `tests/query-builder-sidebar.test.ts`
- `tests/query-builder-results.test.ts`

### 验收标准

- 同模板下至少 2 个视图可持久化
- 切换视图不影响模板条件
- 默认视图能稳定恢复

## Task B3：调整类型模型，减少 snapshot 中心化设计

### 目标

弱化 `QueryBuilderSnapshot` 作为持久化中心的地位，使其仅用于编辑态。

### 建议

保留：

- `QueryBuilderSnapshot`

但重新定义其职责：

- 仅作为当前编辑中的组合态对象
- 不再直接作为唯一持久化结构

### 影响文件

- `src/core/query/types.ts`
- `src/composables/query-builder-store.ts`
- 全部 storage 相关测试

### 验收标准

- 类型语义清晰
- 持久化接口不再要求整份 snapshot 才能保存

## Task C1：增加轻量指标采集

### 目标

增加最小可用的本地统计，支持后续评估功能使用情况。

### 建议新增文件

- `src/core/storage/metrics-store.ts`

### 建议存储结构

```ts
interface QueryBuilderMetrics {
  queryRuns: number
  templateSaves: number
  embedInsertions: number
  quickEdits: number
  boardDrags: number
  viewSwitches: Record<string, number>
}
```

### 埋点位置建议

- `runQuery`
- `saveTemplate`
- `insertEmbed`
- `quickEdit`
- `dropToColumn`
- 视图 tab 切换

### 测试建议

新增：

- `tests/metrics-store.test.ts`

### 验收标准

- 不依赖外部服务
- 不阻塞主流程
- 数据可持续累积

## Task C2：补充关键回归测试

### 目标

针对后续重构高风险区域补测试，防止功能回退。

### 建议补测区域

- 运行前校验
- 多视图存储
- 默认视图恢复
- 旧数据迁移
- 看板拖拽能力提示

### 验收标准

- Phase A 和 B 完成后测试总数显著增加
- 关键 store 行为不再仅靠手测验证

## Task D1：日历视图

### 前置依赖

- 完成 Task B1
- 完成 Task B2

### 目标

为日期字段提供 calendar 视图渲染。

### 建议影响文件

- `src/core/query/types.ts`
- `src/components/query-builder/QueryBuilderResults.vue`
- `src/composables/query-builder-store.ts`
- `src/core/view/`

### 最小实现范围

- 月视图
- 指定一个日期字段
- 点击日历项跳转原始块

## 4. 推荐提交切片

建议按下面粒度提交，避免一个大改动难 review：

1. `Add draft validation for query builder`
2. `Show validation issues before running queries`
3. `Persist and restore default view type`
4. `Split template and view stores into v2 structure`
5. `Migrate snapshot storage to template and view stores`
6. `Support multiple saved views per template`
7. `Add local metrics store for key query builder actions`

## 5. 推荐文件改动顺序

建议按下面顺序实施，减少来回返工：

1. `src/core/query/validation.ts`
2. `src/composables/query-builder-store.ts`
3. `src/components/query-builder/QueryBuilderEditor.vue`
4. `src/components/query-builder/QueryBuilderResults.vue`
5. `src/core/storage/query-template-store.ts`
6. `src/core/storage/view-config-store.ts`
7. `src/core/storage/migrations.ts`
8. `src/components/query-builder/QueryBuilderSidebar.vue`
9. 新增与更新对应测试

## 6. 风险提示

## 6.1 存储迁移风险

风险：

- 已保存模板可能丢失
- 旧版本数据兼容不完整

缓解建议：

- 迁移前读取旧数据并保底备份
- migration 单测必须先写

## 6.2 UI 复杂度膨胀风险

风险：

- 为支持多视图后，侧边栏和结果区交互可能变复杂

缓解建议：

- 先做最小功能，不一次性加太多按钮
- 默认视图、另存为视图、删除视图三项先够用

## 6.3 过早扩展视图风险

风险：

- 日历、时间线、更多统计视图会稀释主线工作

缓解建议：

- 在 Phase A/B 未完成前，不启动 D1

## 7. Definition of Done

当下面条件同时满足时，可认为本轮 PRD gap 收口完成：

- 用户在运行前能看到主要配置错误
- 模板和视图配置已解耦
- 同模板支持多个视图配置
- 默认视图可设置且可恢复
- 关键链路有测试覆盖
- 构建与测试稳定通过

## 8. 建议下一步

如果直接开始编码，建议先做：

1. Task A1：草稿校验模块
2. Task A2：默认视图过渡实现

这是当前投入最小、用户感知最直接、对 PRD 收口价值最高的两项。
