export default function AnalyticsLoading() {
  return (
    <div className="flex flex-col gap-6 font-mono">
      <div className="bg-white p-6 rounded-2xl border border-[#EDE7FF] shadow-sm animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded" />
        <div className="h-3 w-64 bg-gray-100 rounded mt-2" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-[#EDE7FF] shadow-sm animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-3 w-20 bg-gray-200 rounded" />
              <div className="h-10 w-10 bg-gray-100 rounded-xl" />
            </div>
            <div className="h-9 w-24 bg-gray-200 rounded mb-3" />
            <div className="h-4 w-32 bg-gray-100 rounded" />
            <div className="h-4 w-28 bg-gray-100 rounded mt-2" />
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-[#EDE7FF] shadow-sm animate-pulse">
        <div className="h-5 w-56 bg-gray-200 rounded mb-1" />
        <div className="h-3 w-72 bg-gray-100 rounded mb-6" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 w-48 bg-gray-200 rounded" />
              <div className="flex-1 h-7 bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
