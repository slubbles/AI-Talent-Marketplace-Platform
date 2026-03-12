"use client";

import { usePathname } from "next/navigation";

type NavLinkProps = {
  href: string;
  label: string;
  match: string;
};

export function NavLink({ href, label, match }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === match || (match !== "/dashboard" && pathname.startsWith(`${match}/`));

  return (
    <a aria-current={isActive ? "page" : undefined} className={`dashboard-nav-link${isActive ? " is-active" : ""}`} href={href}>
      {label}
    </a>
  );
}