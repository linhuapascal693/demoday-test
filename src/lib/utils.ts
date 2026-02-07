import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export function calculateProgress(mastered: number, total: number): number {
  if (total === 0) return 0
  return Math.round((mastered / total) * 100)
}

export const PROFESSIONS = [
  '英语老师',
  '产品经理',
  '大学生',
  '设计师',
  '程序员',
  '市场营销',
  '数据分析师',
  '教师',
  '医生',
  '律师',
  '其他'
]

export const INTERESTS = [
  '编程',
  '设计',
  '商业',
  '科学',
  '语言',
  '艺术',
  '音乐',
  '历史',
  '心理学',
  '哲学'
]

export const ACHIEVEMENTS = [
  { id: 'first_step', name: '初次启航', description: '完成首次费曼演练', icon: '🚀' },
  { id: 'feynman_master', name: '费曼大师', description: '获得5次满分评价', icon: '🎓' },
  { id: 'knowledge_collector', name: '知识收藏家', description: '收藏20条资讯', icon: '📚' },
  { id: 'learning_streak', name: '学习达人', description: '连续学习7天', icon: '🔥' },
  { id: 'hundred_days', name: '百日坚持', description: '累计学习100天', icon: '💯' },
  { id: 'know_it_all', name: '全知全能', description: '掌握100个知识点', icon: '👑' }
]
