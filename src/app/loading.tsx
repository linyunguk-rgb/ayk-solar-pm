import { Sun } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'

export default function Loading() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-600 animate-spin" />
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600">
            <Sun className="h-5 w-5 text-white" />
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Loading AYK Solar&hellip;
          </p>
          <p className="mt-1 text-xs text-slate-500">{APP_NAME}</p>
        </div>
      </div>
    </div>
  )
}
