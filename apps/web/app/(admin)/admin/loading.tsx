export default function AdminLoading() {
  return (
    <div className="flex flex-col items-center text-center py-16">
      <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Admin workspace</p>
      <div className="w-8 h-8 border-2 border-[#27272A] border-t-[#EFFE5E] rounded-full animate-spin mt-4" aria-hidden="true" />
      <h2 className="text-xl font-bold text-white mt-4">Loading governance workflows</h2>
      <p className="text-sm text-[#A1A1AA] mt-2 max-w-md">Preparing approvals, verification queues, company oversight, concierge operations, and platform analytics.</p>
    </div>
  );
}