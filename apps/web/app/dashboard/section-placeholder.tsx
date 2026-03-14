type SectionPlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  nextStep: string;
};

export function SectionPlaceholder({ eyebrow, title, description, nextStep }: SectionPlaceholderProps) {
  return (
    <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-6">
      <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">{eyebrow}</p>
      <h2 className="text-xl font-bold text-white mt-1">{title}</h2>
      <p className="text-sm text-[#A1A1AA] mt-2">{description}</p>
      <div className="mt-4 bg-[#111111] border border-[#27272A] rounded-md p-3 flex items-center gap-2 text-sm">
        <span className="font-medium text-white">Next session</span>
        <span className="text-[#A1A1AA]">{nextStep}</span>
      </div>
    </div>
  );
}