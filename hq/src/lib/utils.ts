import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Person } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDaysAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const diffMs = Date.now() - d.getTime()
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  return `${diffDays} days ago`
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function getDaysOverdue(person: Person): number {
  const lastContact = new Date(person.last_contact).getTime()
  const dueAt = lastContact + person.checkin_frequency_days * 86400000
  return Math.floor((Date.now() - dueAt) / 86400000)
}

export function urgencySort(people: Person[]): Person[] {
  return [...people].sort((a, b) => getDaysOverdue(b) - getDaysOverdue(a))
}
