"use client";

import { gql } from "@apollo/client";
import { useMemo, useState } from "react";
import { createApolloClient } from "../../../../lib/apollo-client";

type AdminUser = {
  id: string;
  email: string;
  role: "TALENT" | "RECRUITER" | "ADMIN" | "HEADHUNTER";
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type UsersAdminClientProps = {
  accessToken: string;
  initialUsers: AdminUser[];
};

const updateUserAdminMutation = gql`
  mutation UpdateUserAdmin($input: UpdateUserAdminInput!) {
    updateUserAdmin(input: $input) {
      id
      email
      role
      emailVerified
      isActive
      createdAt
      updatedAt
    }
  }
`;

const userRoles = ["ALL", "TALENT", "RECRUITER", "ADMIN", "HEADHUNTER"] as const;
const userStates = ["ALL", "ACTIVE", "INACTIVE"] as const;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));

export function UsersAdminClient({ accessToken, initialUsers }: UsersAdminClientProps) {
  const client = useMemo(() => createApolloClient(accessToken), [accessToken]);
  const [users, setUsers] = useState(initialUsers);
  const [roleFilter, setRoleFilter] = useState<(typeof userRoles)[number]>("ALL");
  const [statusFilter, setStatusFilter] = useState<(typeof userStates)[number]>("ALL");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  const filteredUsers = users.filter((user) => {
    if (roleFilter !== "ALL" && user.role !== roleFilter) {
      return false;
    }

    if (statusFilter === "ACTIVE" && !user.isActive) {
      return false;
    }

    if (statusFilter === "INACTIVE" && user.isActive) {
      return false;
    }

    return true;
  });

  const updateLocalUser = (userId: string, patch: Partial<AdminUser>) => {
    setUsers((current) => current.map((user) => (user.id === userId ? { ...user, ...patch } : user)));
  };

  const saveUser = async (user: AdminUser) => {
    setError(null);
    setMessage(null);
    setSavingUserId(user.id);

    try {
      const result = await client.mutate<{ updateUserAdmin: AdminUser }>({
        mutation: updateUserAdminMutation,
        variables: {
          input: {
            userId: user.id,
            role: user.role,
            emailVerified: user.emailVerified,
            isActive: user.isActive
          }
        }
      });

      if (!result.data?.updateUserAdmin) {
        throw new Error("The user could not be updated.");
      }

      updateLocalUser(user.id, result.data.updateUserAdmin);
      setMessage(`Updated ${user.email}.`);
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Could not update the user.");
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-6 space-y-5">
      <div>
        <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">User management</p>
        <h3 className="text-lg font-semibold text-white mt-1">Roles, verification, and activation state</h3>
      </div>

      <div className="flex gap-4 items-end">
        <label className="flex flex-col gap-1 text-sm text-[#A1A1AA]">
          Role
          <select className="bg-[#1A1A1A] border border-[#27272A] text-white rounded-md px-3 py-1.5 text-sm" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as (typeof userRoles)[number])}>
            {userRoles.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-[#A1A1AA]">
          Status
          <select className="bg-[#1A1A1A] border border-[#27272A] text-white rounded-md px-3 py-1.5 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as (typeof userStates)[number])}>
            {userStates.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </label>
      </div>

      {message ? <p className="text-green-400 bg-green-950/30 border border-green-900 rounded-md px-3 py-2 text-sm">{message}</p> : null}
      {error ? <p className="text-red-400 bg-red-950/30 border border-red-900 rounded-md px-3 py-2 text-sm">{error}</p> : null}

      <div className="grid gap-4">
        {filteredUsers.map((user) => (
          <article className="bg-[#111111] border border-[#27272A] rounded-lg p-5" key={user.id}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.isActive ? "bg-green-950 text-green-400" : "bg-zinc-800 text-zinc-500"}`}>{user.isActive ? "ACTIVE" : "INACTIVE"}</span>
                <h4 className="text-sm font-medium text-white">{user.email}</h4>
              </div>
              <span className="text-sm font-medium text-[#A1A1AA]">{user.role}</span>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
              <label className="flex flex-col gap-1 text-[#A1A1AA]">
                Role
                <select className="bg-[#1A1A1A] border border-[#27272A] text-white rounded-md px-3 py-1.5 text-sm" value={user.role} onChange={(event) => updateLocalUser(user.id, { role: event.target.value as AdminUser["role"] })}>
                  {userRoles.filter((value) => value !== "ALL").map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 self-end text-sm text-[#A1A1AA]">
                <input
                  className="accent-[#EFFE5E]"
                  checked={user.emailVerified}
                  onChange={(event) => updateLocalUser(user.id, { emailVerified: event.target.checked })}
                  type="checkbox"
                />
                <span>Email verified</span>
              </label>
              <label className="flex items-center gap-2 self-end text-sm text-[#A1A1AA]">
                <input className="accent-[#EFFE5E]" checked={user.isActive} onChange={(event) => updateLocalUser(user.id, { isActive: event.target.checked })} type="checkbox" />
                <span>User active</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
              <div>
                <span className="text-[#52525B] text-xs">Joined</span>
                <p className="text-white font-medium">{formatDate(user.createdAt)}</p>
              </div>
              <div>
                <span className="text-[#52525B] text-xs">Last update</span>
                <p className="text-white font-medium">{formatDate(user.updatedAt)}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button className="px-4 py-2 rounded-md text-sm font-medium bg-[#EFFE5E] text-[#000000] hover:bg-[#BBB906] disabled:opacity-50 transition-colors" disabled={savingUserId === user.id} onClick={() => saveUser(user)} type="button">
                {savingUserId === user.id ? "Saving..." : "Save changes"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}