export default function RootNotFound() {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center text-center">
        <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Not found</p>
        <h1 className="text-2xl font-bold text-white mt-2">This page does not exist</h1>
        <p className="text-sm text-[#A1A1AA] mt-2 max-w-md">The route you requested is outside the current recruiter, admin, or public application surface.</p>
        <div className="flex gap-3 mt-6">
          <a className="px-4 py-2 rounded-md text-sm font-medium bg-[#EFFE5E] text-[#000000] hover:bg-[#BBB906] transition-colors" href="/">
            Go to landing page
          </a>
          <a className="px-4 py-2 rounded-md text-sm font-medium border border-[#27272A] text-[#A1A1AA] hover:text-white transition-colors" href="/dashboard">
            Open dashboard
          </a>
        </div>
      </div>
    </main>
  );
}