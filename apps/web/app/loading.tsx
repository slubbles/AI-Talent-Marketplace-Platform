export default function RootLoading() {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center text-center">
        <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Loading</p>
        <div className="w-8 h-8 border-2 border-[#27272A] border-t-[#EFFE5E] rounded-full animate-spin mt-4" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-white mt-4">Preparing the platform workspace</h1>
        <p className="text-sm text-[#A1A1AA] mt-2 max-w-md">Loading the recruiter, admin, and marketplace context for this route.</p>
      </div>
    </main>
  );
}