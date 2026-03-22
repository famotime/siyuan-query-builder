# Project Structure

## Overview

`siyuan-query-builder` 是一个面向思源笔记的可视化查询构建器插件。当前结构按“入口装配 -> 查询与存储核心 -> UI 分区组件 -> 行内渲染”组织，重点把复杂状态编排和大型 UI 区块拆成更小的边界。

## Root

| 路径 | 说明 |
| --- | --- |
| `src/` | 插件源代码 |
| `tests/` | Vitest 测试，按功能域镜像源码 |
| `docs/` | 产品、设计、重构和结构文档 |
| `developer_docs/` | 开发参考资料 |
| `dist/` | 构建产物 |
| `plugin-sample-vite-vue/` | 上游示例，不是当前主要实现目录 |

## Source Layout

### `src/index.ts`
- 插件入口。
- 负责思源插件生命周期、顶栏图标、命令注册，以及面板/行内渲染器启动与销毁。

### `src/main.ts`
- Dialog 挂载和 Vue 根实例启动。
- 负责面板级错误兜底和运行时错误持久化。

### `src/composables/query-builder-store.ts`
- 查询构建器主 store 的装配入口。
- 暴露稳定的 UI 使用接口，并组合下面三个子控制器。

### `src/composables/query-builder-store/`
- `shared.ts`
  - store 共享常量和纯 helper。
  - 包括草稿创建、快照生成、字段选项合并、聚合字段同步、可编辑字段判断等。
- `template-view-controller.ts`
  - 模板/视图持久化控制器。
  - 负责模板加载、视图另存、默认视图切换、删除和迁移就绪。
- `query-execution-controller.ts`
  - 查询执行、副作用提示、快速回写、嵌入块插入、看板拖拽写回。
- `embed-target-controller.ts`
  - 当前文档识别、最近嵌入目标、提示文案和嵌入目标持久化。

### `src/core/`
- `query/`
  - 查询领域模型、SQL 编译、校验、默认字段/视图定义。
- `runtime/`
  - 查询运行时和内核适配层。
- `storage/`
  - 模板、视图、指标和迁移存储逻辑。
  - `collection-storage.ts` 提供数组型持久化的共享 helper。
- `view/`
  - 看板列等结果视图辅助逻辑。
- `embed.ts` / `embed-target.ts`
  - 嵌入块 payload 与目标识别/格式化辅助。

### `src/components/query-builder/`
- `QueryBuilderSidebar.vue`
  - 模板列表、预设入口和模板级操作。
- `QueryBuilderEditor.vue`
  - 编辑区页面级编排。
- `EditorViewSettingsSection.vue`
  - 视图设置区块，承载分组、聚合、排序和输出字段配置。
- `EditorFieldPicker.vue`
  - 输出字段多选器和自定义字段输入。
- `QueryBuilderResults.vue`
  - 结果区页面级编排。
- `ResultsSavedViewsPanel.vue`
  - 同模板多视图的展示和操作。
- `ResultsEmbedPanel.vue`
  - 嵌入目标选择和嵌入块生成入口。
- `DeleteIconButton.vue`
  - 统一的图标删除按钮。

### `src/inline/`
- 行内渲染器、扫描控制器、视图模型和 `InlineQueryWidget.vue`。

### `src/ui/`
- 宿主样式和 shell 层适配。

### `src/i18n/`
- `zh_CN.json`、`en_US.json` 语言包。

### `src/external/` / `src/api.ts`
- 思源 API 边界和请求封装。

## Test Layout

| 测试文件 | 主要覆盖 |
| --- | --- |
| `tests/query-builder-store-views.test.ts` | store 模板/视图管理、嵌入目标、快速回写、错误分支和指标记录 |
| `tests/query-builder-results.test.ts` | 结果区视图切换、已保存视图、嵌入目标菜单、空态 |
| `tests/query-builder-editor.test.ts` | 编辑区折叠、聚合配置、字段选择器、校验提示 |
| `tests/query-template-store.test.ts` | 模板存储顺序和删除行为 |
| `tests/view-config-store.test.ts` | 默认视图互斥和模板级删除 |
| `tests/query-compiler.test.ts` | SQL 编译规则 |
| `tests/query-validation.test.ts` | 查询校验规则 |
| `tests/runtime.test.ts` | 查询执行、属性写回、嵌入块生成 |

## Current Refactor Notes

- store 已从单文件大块逻辑拆成“共享 helper + 模板/视图控制器 + 查询执行控制器 + 嵌入目标控制器”。
- 结果区和编辑区都已拆出高耦合子组件，主页面组件现在更偏向编排层。
- 存储层的数组读写逻辑已统一到共享 helper，减少重复实现。
