# siyuan-query-builder

面向思源笔记的可视化查询构建器插件，提供查询模板、结果多视图和嵌入渲染能力。

## 当前能力

- 可视化配置查询范围、条件、排序、分组、聚合和输出字段
- 保存查询模板，并在同一模板下维护多个结果视图
- 表格、看板、列表、统计卡片四种结果视图
- 状态、日期、优先级字段的快速属性回写
- 将查询结果以嵌入块形式插入到文档或块下
- 在文档块内按模板和视图配置进行行内渲染

## 项目结构

- `src/composables/query-builder-store.ts`
  - 查询构建器主 store 装配层
- `src/composables/query-builder-store/`
  - store 子控制器和共享 helper
- `src/core/`
  - 查询、运行时、存储、嵌入和视图核心逻辑
- `src/components/query-builder/`
  - 侧边栏、编辑区、结果区及其拆分后的子组件
- `src/inline/`
  - 行内渲染器和视图模型
- `tests/`
  - Vitest 测试，按功能域镜像源码

更详细的结构说明见 [docs/project-structure.md](docs/project-structure.md)。

## 开发

```bash
npm install --legacy-peer-deps
npm run dev
```

## 构建

```bash
npm run build
```

## 测试

```bash
npm run test:run
```

当前基线：25 个测试文件，72 个测试用例。
