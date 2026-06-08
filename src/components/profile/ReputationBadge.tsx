'use client'

import type { ReputationSeal } from '@/lib/profile/types'

interface Props {
  seal: ReputationSeal
  size?: 'sm' | 'md' | 'lg'
}

const SEAL_CONFIG: Record<
  ReputationSeal,
  { label: string; icon: string; bg: string; text: string; border: string }
> = {
  new: {
    label: 'Novo',
    icon: '✦',
    bg: 'bg-gray-100',
    text: 'text-gray-500',
    border: 'border-gray-200',
  },
  trusted: {
    label: 'Confiável',
    icon: '✓',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  top_rated: {
    label: 'Top Rated',
    icon: '⭐',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  verified: {
    label: 'Verificado',
    icon: '🛡',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
}

const SIZE_CLASSES = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-3 py-1 gap-1.5',
  lg: 'text-base px-4 py-1.5 gap-2',
}

export function ReputationBadge({ seal, size = 'md' }: Props) {
  const cfg = SEAL_CONFIG[seal]
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border} ${SIZE_CLASSES[size]}`}
    >
      <span aria-hidden="true">{cfg.icon}</span>
      {cfg.label}
    </span>
  )
}