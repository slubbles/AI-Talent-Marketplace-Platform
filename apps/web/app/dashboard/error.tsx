"use client";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center text-center py-16">
      <p className="text-xs uppercase tracking-wider text-red-400">Recruiter workspace error</p>
      <h2 className="text-xl font-bold text-white mt-2">Dashboard data could not be loaded</h2>
      <p className="text-sm text-[#A1A1AA] mt-2 max-w-md">{error.message || "A recruiter workspace error occurred."}</p>
      <div className="flex gap-3 mt-6">
        <button className="px-4 py-2 rounded-md text-sm font-medium bg-[#EFFE5E] text-[#000000] hover:bg-[#BBB906] transition-colors" onClick={() => reset()} type="button">
          Retry dashboard
        </button>
        <a className="px-4 py-2 rounded-md text-sm font-medium border border-[#27272A] text-[#A1A1AA] hover:text-white transition-colors" href="/dashboard">
          Back to dashboard home
        </a>
      </div>
    </div>
  );
}