import Link from "next/link";
import { graphQLRequest } from "../../../lib/graphql";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

import { getSession } from "../../../lib/session";
const rolesQuery = `#graphql
  query RecruiterRoles($filters: DemandFiltersInput) {
    demands(filters: $filters, pagination: { first: 50 }) {
      edges {
        node {
          id
          title
          status
          location
          remotePolicy
          experienceLevel
          budgetMin
          budgetMax
          currency
          updatedAt
          company {
            id
            name
            industry
          }
          requiredSkills {
            id
            skill {
              id
              displayName
            }
          }
        }
      }
    }
  }
`;

type RolesPageProps = {
  searchParams?: { status?: string };
};

const statusFilters = ["ALL", "DRAFT", "ACTIVE", "PAUSED", "FILLED", "CANCELLED"] as const;

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-green-950 text-green-400",
  DRAFT: "bg-[#27272A] text-[#A1A1AA]",
  PAUSED: "bg-blue-950 text-blue-400",
  FILLED: "bg-[#1a1c00] text-[#EFFE5E]",
  CANCELLED: "bg-[#27272A] text-[#52525B]",
  PENDING: "bg-amber-950 text-amber-400",
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));

export default async function RolesPage({ searchParams }: RolesPageProps) {
  const session = await getSession();
  const activeStatus = searchParams?.status && statusFilters.includes(searchParams.status as (typeof statusFilters)[number])
    ? searchParams.status
    : "ALL";

  const data = await graphQLRequest<{
    demands: {
      edges: Array<{
        node: {
          id: string;
          title: string;
          status: string;
          location: string;
          remotePolicy: string;
          experienceLevel: string;
          budgetMin: number | null;
          budgetMax: number | null;
          currency: string;
          updatedAt: string;
          company: { id: string; name: string; industry: string };
          requiredSkills: Array<{ id: string; skill: { id: string; displayName: string } }>;
        };
      }>;
    };
  }>(rolesQuery, { filters: activeStatus === "ALL" ? undefined : { status: activeStatus } }, session?.accessToken);

  const roles = data.demands.edges.map((edge) => edge.node);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="text-2xl font-bold">Role Demands</h1>
          <p className="text-sm text-[#A1A1AA]">Create, monitor, and manage your hiring pipeline.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/roles/new"><Plus className="h-4 w-4" /> New Role</Link>
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-0.5 mt-4">
        {statusFilters.map((status) => {
          const isActive = activeStatus === status;
          const href = status === "ALL" ? "/dashboard/roles" : `/dashboard/roles?status=${status}`;
          return (
            <Link
              key={status}
              href={href}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                isActive ? "bg-primary/10 text-white border-b-2 border-primary" : "text-[#A1A1AA] hover:text-white"
              }`}
            >
              {status}
            </Link>
          );
        })}
      </div>

      {/* Table */}
      <div className="mt-4 bg-[#0A0A0A] border border-[#27272A] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#27272A]">
              {["Role Title", "Company", "Status", "Skills", "Experience", "Budget", "Updated", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#52525B] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center">
                  <p className="text-[#A1A1AA] mb-3">No roles match this filter.</p>
                  <Button asChild>
                    <Link href="/dashboard/roles/new"><Plus className="h-4 w-4" /> New Role</Link>
                  </Button>
                </td>
              </tr>
            ) : (
              roles.map((role) => (
                <tr key={role.id} className="h-14 border-b border-[#27272A] last:border-b-0 hover:bg-[#222222] transition-colors">
                  <td className="px-4 font-medium">
                    <Link href={`/dashboard/roles/${role.id}`} className="hover:text-primary">{role.title}</Link>
                  </td>
                  <td className="px-4 text-[#A1A1AA]">{role.company.name}</td>
                  <td className="px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[role.status] ?? statusStyles.DRAFT}`}>
                      {role.status}
                    </span>
                  </td>
                  <td className="px-4">
                    <div className="flex gap-1 items-center">
                      {role.requiredSkills.slice(0, 2).map((s) => (
                        <span key={s.id} className="px-2 py-0.5 bg-[#1A1A1A] border border-[#27272A] rounded text-xs text-[#A1A1AA]">
                          {s.skill.displayName}
                        </span>
                      ))}
                      {role.requiredSkills.length > 2 && (
                        <span className="text-xs text-[#52525B]">+{role.requiredSkills.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 text-[#A1A1AA]">{role.experienceLevel}</td>
                  <td className="px-4 text-[#A1A1AA]">
                    {role.budgetMin && role.budgetMax
                      ? `${role.currency} ${role.budgetMin}–${role.budgetMax}`
                      : "Not set"}
                  </td>
                  <td className="px-4 text-[#A1A1AA]">{formatDate(role.updatedAt)}</td>
                  <td className="px-4">
                    <Link href={`/dashboard/roles/${role.id}`} className="text-primary text-xs hover:underline">Open</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
