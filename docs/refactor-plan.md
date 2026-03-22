# 重构计划

## 1. 项目快照

- 生成日期：2026-03-22
- 范围：`D:\MyCodingProjects\siyuan-query-builder`
- 目标：在不改变插件对外行为的前提下，降低查询构建器状态层与大型 Vue 组件的复杂度，提升可测性与后续演进安全性
- 文档刷新目标：`docs/project-structure.md`、`README.md`
- 当前基线：
  - `git status --short` 显示存在未由本次任务创建的改动：`docs/siyuan-query-builder-dev-plan.md`、`package.zip`、`AGENTS.md`、`CLAUDE.md`、`docs/design.html`
  - `npm run test:run`：通过，25 个测试文件 / 62 个用例
  - `docs/project-structure.md` 当前不存在，若进入实施阶段将在获批范围完成后新增

## 2. 架构与模块分析

| 模块 | 关键文件 | 当前职责 | 主要痛点 | 测试覆盖情况 |
| --- | --- | --- | --- | --- |
| 插件入口与生命周期 | `src/index.ts`、`src/main.ts`、`src/App.vue` | 插件启动、Dialog 挂载、Vue 根实例初始化、错误兜底 | 生命周期本身不重，但 `main.ts` 同时负责挂载、错误持久化和 DOM 错误回退，后续若扩展入口能力容易继续堆积职责 | 缺少对 `src/main.ts` 的直接测试，入口行为主要靠组件和集成边界间接覆盖 |
| 查询构建状态编排 | `src/composables/query-builder-store.ts` | 管理草稿模板、视图切换、查询执行、模板/视图持久化、嵌入目标状态、拖拽回写、统计埋点 | 单文件体量最大，混合了领域状态、持久化、异步副作用、UI 派生状态和提示消息；修改任一流程时易引发回归，且内部私有函数目前难以定向测试 | 有 `tests/query-builder-store-views.test.ts`，覆盖视图保存/切换与部分指标；但初始化、嵌入目标、快速回写、拖拽写回、错误分支覆盖薄弱 |
| 查询领域逻辑 | `src/core/query/compiler.ts`、`src/core/query/validation.ts`、`src/core/query/catalog.ts`、`src/core/query/types.ts` | 查询模板建模、SQL 编译、校验、默认视图/字段定义 | 领域边界相对清晰，但部分逻辑被 `query-builder-store` 重新编排，导致领域规则与 UI 状态耦合 | `tests/query-compiler.test.ts`、`tests/query-validation.test.ts`、`tests/query-catalog.test.ts` 已覆盖主要纯逻辑 |
| 结果区 UI 与交互 | `src/components/query-builder/QueryBuilderResults.vue` | 结果头部、视图切换、已保存视图操作、嵌入目标选择、列表/看板/卡片渲染与回写入口 | 模板和事件处理较集中，依赖 store 过宽，后续增加结果视图或嵌入行为时会继续膨胀 | `tests/query-builder-results.test.ts`、`tests/query-builder-results-advanced-mode.test.ts`、`tests/query-builder-delete-actions.test.ts` 覆盖基础展示与按钮连线 |
| 编辑区 UI 与配置表单 | `src/components/query-builder/QueryBuilderEditor.vue` | 范围、过滤、排序、字段、聚合、属性映射等表单编辑 | 表单分区与条件分支较多，但当前逻辑仍主要是视图层；适合在状态层降复杂度后再做轻量拆分 | `tests/query-builder-editor.test.ts` 覆盖折叠区、聚合控件、校验提示、字段选择器 |
| 嵌入目标与行内渲染 | `src/core/embed-target.ts`、`src/core/embed.ts`、`src/inline/*` | 当前文档识别、最近嵌入目标、行内挂载与刷新 | 领域辅助函数清楚，但其异步解析与状态同步仍深嵌于 store 中 | `tests/embed-target.test.ts`、`tests/embed.test.ts`、`tests/inline-*.test.ts` 已覆盖核心纯逻辑和扫描流程 |
| 存储层 | `src/core/storage/query-template-store.ts`、`src/core/storage/view-config-store.ts`、`src/core/storage/template-view.ts`、`src/core/storage/migrations.ts`、`src/core/storage/metrics-store.ts` | 模板/视图/指标存储和旧数据迁移 | `query-template-store` 与 `view-config-store` 结构重复，后续改动容易双份维护；不过风险低于状态层 | 各模块已有对应测试，基础行为覆盖较好 |
| SiYuan API 适配 | `src/api.ts`、`src/core/runtime/kernel-adapter.ts`、`src/external/siyuan.ts` | API 请求封装、运行时适配、第三方边界 | `src/api.ts` 文件大且泛化，但很多内容是通用封装，和当前高风险重构目标相比收益较低 | `tests/runtime.test.ts` 覆盖了查询运行时的插件使用路径，未直接约束 `src/api.ts` 全量接口 |

## 3. 按优先级排序的重构待办

| ID | 优先级 | 模块/场景 | 涉及文件 | 重构目标 | 风险等级 | 重构前测试清单 | 文档影响 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RF-001 | P0 | 拆分 `query-builder-store` 中的“模板/视图持久化 + 查询执行 + 嵌入目标状态”职责 | `src/composables/query-builder-store.ts`、`src/composables/query-builder-store/shared.ts`、`src/composables/query-builder-store/template-view-controller.ts`、`src/composables/query-builder-store/query-execution-controller.ts`、`src/composables/query-builder-store/embed-target-controller.ts`、`tests/query-builder-store-views.test.ts` | 保持 `createQueryBuilderStore()` 对组件暴露的公共 API 不变，将私有逻辑拆成可独立验证的 helper/service，降低单文件复杂度和回归面 | 高 | - [x] 为初始化流程补测试：加载笔记本、恢复最近嵌入目标、恢复当前嵌入 ID 时的状态不变式<br>- [x] 为嵌入目标选择补测试：`selectCurrentDocumentTarget`、`selectEmbedTarget`、`rememberEmbedTarget` 去重与持久化<br>- [x] 为执行与写回补测试：`runQuery` 错误分支、`quickEdit`、`dropToColumn` 合法/非法分组分支<br>- [x] 为保存流程补测试：`saveTemplate` / `saveViewAs` / `deleteSavedView` 的行为不变式 | `docs/project-structure.md`：最终文档刷新时补充 store 子模块职责说明；`README.md`：最终文档刷新时补充开发结构与测试说明 | done |
| RF-002 | P1 | 收敛结果区组件的交互边界，减少 `QueryBuilderResults.vue` 模板与事件处理耦合 | `src/components/query-builder/QueryBuilderResults.vue`、`src/components/query-builder/ResultsSavedViewsPanel.vue`、`src/components/query-builder/ResultsEmbedPanel.vue`、`tests/query-builder-results.test.ts` | 将保存视图操作、嵌入目标选择器拆成更小边界，减少对整个 store 的宽依赖，保证现有 DOM 行为和测试选择器稳定 | 中 | - [x] 为已保存视图操作补充行为测试，确保 load/default/delete/save-as 按钮契约不变<br>- [x] 为嵌入目标菜单开合与选择路径补测试<br>- [x] 为看板拖拽提示与空态渲染补测试，确保文案和交互入口不变 | `docs/project-structure.md`：最终文档刷新时补充结果区子模块结构；`README.md`：最终文档刷新时补充开发结构说明 | done |
| RF-003 | P1 | 收敛编辑区配置表单复杂度，抽离可配置区块和字段选择辅助逻辑 | `src/components/query-builder/QueryBuilderEditor.vue`、`src/components/query-builder/EditorViewSettingsSection.vue`、`src/components/query-builder/EditorFieldPicker.vue`、`tests/query-builder-editor.test.ts` | 减少大型模板中的条件分支和重复片段，保留当前交互文案、字段勾选方式、聚合配置行为和测试选择器 | 中 | - [x] 为字段选择器、聚合配置、区块折叠状态补足回归测试<br>- [x] 为校验提示与按钮状态补测试，确保执行前提示不变 | `docs/project-structure.md`：最终文档刷新时补充编辑区拆分结构；`README.md`：最终文档刷新时同步开发结构变化 | done |
| RF-004 | P2 | 合并重复的存储适配样板，减少 `query-template-store` / `view-config-store` 双份维护 | `src/core/storage/query-template-store.ts`、`src/core/storage/view-config-store.ts`、`src/core/storage/collection-storage.ts`、`tests/query-template-store.test.ts`、`tests/view-config-store.test.ts` | 在不改变存储 key、排序策略和删除语义的前提下提炼共享读写逻辑 | 低 | - [x] 保留模板存储插入顺序测试<br>- [x] 保留视图默认项互斥与模板级删除测试 | `docs/project-structure.md`：已补充共享存储 helper；`README.md`：已同步开发结构更新 | done |

优先级说明：
- `P0`：价值和风险都最高，优先执行
- `P1`：价值或风险中等，放在 `P0` 之后
- `P2`：低风险清理项，最后执行

状态说明：
- `pending`
- `in_progress`
- `done`
- `blocked`

## 4. 执行日志

| ID | 开始日期 | 结束日期 | 验证命令 | 结果 | 已刷新文档 | 备注 |
| --- | --- | --- | --- | --- | --- | --- |
| BASELINE | 2026-03-22 | 2026-03-22 | `npm run test:run` | pass | 无 | 当前基线稳定，可在批准后按条目逐项执行 |
| RF-001 | 2026-03-22 | 2026-03-22 | `npm run test:run -- tests/query-builder-store-views.test.ts`；`npm run test:run` | pass | 待最终统一刷新 | 已新增 6 个 store 行为测试，并将 store 拆分为共享 helper、模板/视图控制器、嵌入目标控制器、查询执行控制器 |
| RF-002 | 2026-03-22 | 2026-03-22 | `npm run test:run -- tests/query-builder-results.test.ts tests/query-builder-results-advanced-mode.test.ts tests/query-builder-delete-actions.test.ts`；`npm run test:run` | pass | 待最终统一刷新 | 已新增结果空态与嵌入目标菜单行为测试，并拆出结果区的已保存视图面板与嵌入面板子组件 |
| RF-003 | 2026-03-22 | 2026-03-22 | `npm run test:run -- tests/query-builder-editor.test.ts tests/query-builder-delete-actions.test.ts`；`npm run test:run` | pass | 待最终统一刷新 | 已抽离编辑区的视图设置区块和字段选择器组件，保留现有 data selector 与交互文案 |
| RF-004 | 2026-03-22 | 2026-03-22 | `npm run test:run -- tests/query-template-store.test.ts tests/view-config-store.test.ts`；`npm run test:run` | pass | `docs/project-structure.md`、`README.md` | 已提炼数组型存储共享 helper，并补充模板顺序与模板级删除测试 |

## 5. 决策与确认

- 用户批准的条目：`RF-001`、`RF-002`、`RF-003`、`RF-004`
- 延后的条目：
- 阻塞条目及原因：
- 建议批准顺序：
  1. `RF-001`
  2. `RF-002`
  3. `RF-003`
  4. `RF-004`

## 6. 文档刷新

- `docs/project-structure.md`：已新增，反映最新模块结构、职责映射与测试入口
- `README.md`：已刷新，反映最新项目结构、开发命令、能力清单与测试基线
- 最终同步检查：已完成，文档内容与当前代码结构一致

## 7. 下一步

1. 全部获批条目已完成，后续如需继续重构可基于当前拆分边界继续细化
2. 若新增 UI 或 store 逻辑，优先沿用已经拆出的子组件/控制器边界扩展
3. 后续变更继续以定向测试 + 全量测试为基线
