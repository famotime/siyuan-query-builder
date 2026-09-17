import type { TaskStatus } from "./types"

/**
 * 格式化 Date 为 YYYY-MM-DD
 */
export function formatIsoDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * 生成一段日期序列 [startIso, endIso]
 */
export function generateDateRange(startIso: string, endIso: string): string[] {
  const list: string[] = []
  const dt = new Date(`${startIso}T00:00:00`)
  const end = new Date(`${endIso}T00:00:00`)
  while (dt <= end) {
    list.push(formatIsoDate(dt))
    dt.setDate(dt.getDate() + 1)
  }
  return list
}

/**
 * 计算连续达标天数（Streak）
 * @param dateCountMap 日期与数值映射
 * @param goal 达标阈值
 * @param todayIso 今天的日期 (YYYY-MM-DD)
 */
export function calculateStreak(
  dateCountMap: Record<string, number>,
  goal: number,
  todayIso: string,
): { curStreak: number; maxStreak: number } {
  const dates = Object.keys(dateCountMap).sort()
  if (!dates.length) {
    return { curStreak: 0, maxStreak: 0 }
  }

  // 计算当前连续天数：从今天或昨天倒序查找
  const todayVal = dateCountMap[todayIso] || 0
  let curStreak = 0

  const refDate = new Date(`${todayIso}T00:00:00`)
  // 如果今天达标，从今天开始往前回溯；如果今天未达标，但昨天达标，则从昨天往前回溯
  let checkDate = new Date(refDate)
  if (todayVal < goal) {
    checkDate.setDate(checkDate.getDate() - 1)
  }

  while (true) {
    const iso = formatIsoDate(checkDate)
    const val = dateCountMap[iso] || 0
    if (val >= goal) {
      curStreak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      break
    }
  }

  // 计算全历史最大连续达标天数
  let maxStreak = 0
  let run = 0
  // 取全量连续日期跨度
  const allDays = generateDateRange(dates[0], todayIso)
  for (const day of allDays) {
    const val = dateCountMap[day] || 0
    if (val >= goal) {
      run++
      if (run > maxStreak) maxStreak = run
    } else {
      run = 0
    }
  }

  return { curStreak, maxStreak }
}

/**
 * 7 日移动平均线 (Moving Average 7)
 */
export function calculateMA7(values: number[]): number[] {
  return values.map((_, i) => {
    const from = Math.max(0, i - 6)
    let sum = 0
    for (let j = from; j <= i; j++) {
      sum += values[j]
    }
    return Math.round((sum / (i - from + 1)) * 10) / 10
  })
}

export interface WeekdayStatItem {
  weekday: number // 1=周一, 7=周日
  label: string // 周一 ~ 周日
  total: number
  days: number
  avg: number
  reachCount: number
}

/**
 * 按星期几聚合统计
 */
export function aggregateByWeekday(
  dateCountMap: Record<string, number>,
  days: string[],
  goal = 1,
): WeekdayStatItem[] {
  const weekLabels = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
  // 索引 0=周一 ... 6=周日
  const agg = [0, 1, 2, 3, 4, 5, 6].map(i => ({
    weekday: i + 1,
    label: weekLabels[i],
    total: 0,
    days: 0,
    reachCount: 0,
  }))

  for (const d of days) {
    const dt = new Date(`${d}T00:00:00`)
    const rawDay = dt.getDay() // 0=周日, 1=周一
    const idx = rawDay === 0 ? 6 : rawDay - 1
    const val = dateCountMap[d] || 0
    agg[idx].total += val
    agg[idx].days++
    if (val >= goal) agg[idx].reachCount++
  }

  return agg.map(a => ({
    ...a,
    avg: a.days ? Math.round((a.total / a.days) * 10) / 10 : 0,
  }))
}

export interface FrequencyBucket {
  label: string
  count: number
  color?: string
}

/**
 * 分桶统计
 */
export function calculateBuckets(
  values: number[],
  definitions: Array<{ min: number; max: number; label: string; color?: string }>,
): FrequencyBucket[] {
  return definitions.map(def => ({
    label: def.label,
    color: def.color,
    count: values.filter(v => v >= def.min && v <= def.max).length,
  }))
}

/**
 * 解析任务状态标记
 * [ ] -> todo
 * [/] -> doing
 * [x] / [X] -> done
 * [-] -> canceled
 * [+] -> deferred
 */
export function parseTaskStatus(text: string): TaskStatus {
  const marker = /\[([^\]\n\r]{0,8})\]/.exec(text || "")
  if (marker) {
    const val = marker[1].trim().toLowerCase()
    if (val === "") return "todo"
    if (val === "/") return "doing"
    if (val === "x") return "done"
    if (val === "-") return "canceled"
    if (val === "+") return "deferred"
  }
  return "todo"
}

/**
 * 从 hpath (如 /日记/2026-09-17) 中解析 ISO 日期
 */
export function parseDateFromHPath(hpath: string): string | null {
  const match = /(\d{4})-(\d{1,2})-(\d{1,2})/.exec(hpath || "")
  if (!match) return null
  const pad = (s: string) => s.padStart(2, "0")
  return `${match[1]}-${pad(match[2])}-${pad(match[3])}`
}
