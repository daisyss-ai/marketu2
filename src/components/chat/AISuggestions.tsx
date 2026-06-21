'use client'

interface AISuggestionsProps {
  suggestions: string[]
  isLoading: boolean
  limitReached?: boolean
  onSelect: (suggestion: string) => void
}

function SkeletonChip() {
  return (
    <div className="h-7 w-24 rounded-full bg-[#EDE7FF] animate-pulse" />
  )
}

export default function AISuggestions({
  suggestions,
  isLoading,
  limitReached = false,
  onSelect,
}: AISuggestionsProps) {
  if (isLoading) {
    return (
      <div className="px-4 py-3 bg-white border-t border-[#EDE7FF]">
        <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400 mb-2">
          Sugestões IA
        </p>
        <div className="flex gap-2 overflow-x-auto flex-nowrap pb-1">
          <SkeletonChip />
          <SkeletonChip />
          <SkeletonChip />
        </div>
      </div>
    )
  }

  if (limitReached) {
    return (
      <div className="px-4 py-3 bg-white border-t border-[#EDE7FF]">
        <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400 mb-1">
          Sugestões IA
        </p>
        <p className="text-xs text-gray-400">
          Limite diário de sugestões atingido
        </p>
      </div>
    )
  }

  if (suggestions.length === 0) {
    return null
  }

  return (
    <div className="px-4 py-3 bg-white border-t border-[#EDE7FF]">
      <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400 mb-2">
        Sugestões IA
      </p>
      <div className="flex gap-2 overflow-x-auto flex-nowrap pb-1">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSelect(suggestion)}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-[#F5F0FF] border border-[#EDE7FF] text-[#4B187C] hover:bg-[#EDE7FF] transition-colors"
          >
            <span aria-hidden="true">✨</span>
            <span className="whitespace-nowrap">{suggestion}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
