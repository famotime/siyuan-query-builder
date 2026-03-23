import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const scss = readFileSync(resolve(__dirname, '../src/index.scss'), 'utf-8')

describe('src/index.scss — token completeness', () => {
  it('declares core font tokens', () => {
    expect(scss).toContain('--sqb-serif')
    expect(scss).toContain('--sqb-sans')
    expect(scss).toContain('--sqb-mono')
  })

  it('declares semantic color tokens including info', () => {
    expect(scss).toContain('--sqb-info:')
    expect(scss).toContain('--sqb-info-soft:')
    expect(scss).toContain('--sqb-danger:')
    expect(scss).toContain('--sqb-danger-soft:')
  })

  it('implements dark mode via prefers-color-scheme', () => {
    expect(scss).toContain('prefers-color-scheme: dark')
    expect(scss).toMatch(/prefers-color-scheme.*dark[\s\S]+--sqb-bg/)
  })

  it('implements dark mode via SiYuan .b3-theme-dark class', () => {
    expect(scss).toContain('.b3-theme-dark #siyuan-query-builder-root')
    expect(scss).toMatch(/\.b3-theme-dark[\s\S]+--sqb-bg/)
  })

  it('implements light mode via SiYuan .b3-theme-light class for root and inline embeds', () => {
    expect(scss).toContain('.b3-theme-light #siyuan-query-builder-root')
    expect(scss).toMatch(/\.b3-theme-light[\s\S]+--sqb-bg/)
    expect(scss).toContain('.b3-theme-light .sqb-inline-host')
    expect(scss).toMatch(/\.b3-theme-light \.sqb-inline-host[\s\S]+--sqb-inline-bg/)
  })

  it('defines inline embed theme tokens for host-scoped light and dark themes', () => {
    expect(scss).toContain('.sqb-inline-host')
    expect(scss).toContain('--sqb-inline-bg:')
    expect(scss).toContain('--sqb-inline-text:')
    expect(scss).toContain('.b3-theme-dark .sqb-inline-host')
    expect(scss).toMatch(/\.b3-theme-dark \.sqb-inline-host[\s\S]+--sqb-inline-bg/)
    expect(scss).toContain('.sqb-inline-host.b3-theme-light')
    expect(scss).toContain('.sqb-inline-host.b3-theme-dark')
  })

  it('lets explicit inline host theme markers override prefers-color-scheme', () => {
    expect(scss).toContain('.sqb-inline-host[data-sqb-theme="light"]')
    expect(scss).toContain('.sqb-inline-host[data-sqb-theme="dark"]')
  })

  it('dark mode overrides shadow tokens', () => {
    expect(scss).toMatch(/prefers-color-scheme.*dark[\s\S]+--sqb-shadow-soft/)
    expect(scss).toMatch(/\.b3-theme-dark[\s\S]+--sqb-shadow-soft/)
  })

  it('implements prefers-reduced-motion', () => {
    expect(scss).toContain('prefers-reduced-motion: reduce')
    expect(scss).toContain('animation-duration: 0.01ms')
    expect(scss).toContain('transition-duration: 0.01ms')
  })
})
