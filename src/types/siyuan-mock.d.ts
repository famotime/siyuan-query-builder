/*
 * 对 "siyuan" 模块类型的补充声明。
 * vitest 运行时把 "siyuan" 别名到 tests/mocks/siyuan.ts(测试桩),
 * 该桩在官方 siyuan.d.ts 之外提供了以下成员供测试断言使用。
 */
export {}

declare module "siyuan" {
  interface Plugin {
    dockDefinitions: Array<Record<string, any>>
    topBarItems: Array<Record<string, any>>
  }

  interface Setting {
    items: Array<{
      title: string
      description?: string
      actionElement?: HTMLElement
      createActionElement?: () => HTMLElement
    }>
    openedName: string
  }
}
