export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center text-center py-16">
      <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Recruiter route missing</p>
      <h2 className="text-xl font-bold text-white mt-2">That recruiter page was not found</h2>
      <p className="text-sm text-[#A1A1AA] mt-2 max-w-md">The requested dashboard route is missing or no longer matches the active workflow paths.</p>
      <div className="flex gap-3 mt-6">
        <a className="px-4 py-2 rounded-md text-sm font-medium bg-[#EFFE5E] text-[#000000] hover:bg-[#BBB906] transition-colors" href="/dashboard">
          Dashboard overview
        </a>
        <a className="px-4 py-2 rounded-md text-sm font-medium border border-[#27272A] text-[#A1A1AA] hover:text-white transition-colors" href="/dashboard/roles">
          View roles
        </a>
      </div>
    </div>
  );
}