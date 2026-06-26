import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 font-mono">
      <div className="bg-white p-6 rounded-2xl border border-[#EDE7FF] shadow-sm animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded" />
        <div className="h-3 w-64 bg-gray-100 rounded mt-2" />
      </div>
      <div className="bg-white border border-[#EDE7FF] rounded-2xl p-16 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#4B187C]" />
        <p className="text-sm font-semibold text-gray-500">A carregar utilizadores...</p>
      </div>
    </div>
  )
}
