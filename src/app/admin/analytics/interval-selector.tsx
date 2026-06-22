'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

const intervals = [
  { value: 7, label: '7 dias' },
  { value: 30, label: '30 dias' },
  { value: 90, label: '90 dias' },
]

export function IntervalSelector({ currentInterval }: { currentInterval: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleChange = (value: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('interval', String(value))
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1 bg-white border border-[#EDE7FF] rounded-xl p-1 shadow-sm">
      {intervals.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => handleChange(value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            currentInterval === value
              ? 'bg-[#4B187C] text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
