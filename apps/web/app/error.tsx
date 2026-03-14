"use client";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center text-center">
        <p className="text-xs uppercase tracking-wider text-red-400">Application error</p>
        <h1 className="text-2xl font-bold text-white mt-2">Something broke while rendering this surface</h1>
        <p className="text-sm text-[#A1A1AA] mt-2 max-w-md">{error.message || "An unexpected rendering error occurred."}</p>
        <div className="flex gap-3 mt-6">
          <button className="px-4 py-2 rounded-md text-sm font-medium bg-[#EFFE5E] text-[#000000] hover:bg-[#BBB906] transition-colors" onClick={() => reset()} type="button">
            Try again
          </button>
          <a className="px-4 py-2 rounded-md text-sm font-medium border border-[#27272A] text-[#A1A1AA] hover:text-white transition-colors" href="/">
            Return home
          </a>
        </div>
      </div>
    </main>
  );
}