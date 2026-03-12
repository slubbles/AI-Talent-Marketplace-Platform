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
    <section className="dashboard-panel-card admin-page-stack">
      <div className="dashboard-section-heading">
        <div>
          <span className="eyebrow">User management</span>
          <h3>Roles, verification, and activation state</h3>
        </div>
      </div>

      <div className="admin-filter-row">
        <label>
          Role
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as (typeof userRoles)[number])}>
            {userRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as (typeof userStates)[number])}>
            {userStates.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </label>
      </div>

      {message ? <p className="form-success">{message}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <div className="admin-card-grid">
        {filteredUsers.map((user) => (
          <article className="role-list-card admin-user-card" key={user.id}>
            <div className="role-list-card-header">
              <div>
                <span className={`role-status-badge${user.isActive ? "" : " is-muted"}`}>{user.isActive ? "ACTIVE" : "INACTIVE"}</span>
                <h4>{user.email}</h4>
              </div>
              <strong>{user.role}</strong>
            </div>

            <div className="admin-form-grid compact">
              <label>
                Role
                <select value={user.role} onChange={(event) => updateLocalUser(user.id, { role: event.target.value as AdminUser["role"] })}>
                  {userRoles.filter((value) => value !== "ALL").map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-toggle-row">
                <input
                  checked={user.emailVerified}
                  onChange={(event) => updateLocalUser(user.id, { emailVerified: event.target.checked })}
                  type="checkbox"
                />
                <span>Email verified</span>
              </label>
              <label className="admin-toggle-row">
                <input checked={user.isActive} onChange={(event) => updateLocalUser(user.id, { isActive: event.target.checked })} type="checkbox" />
                <span>User active</span>
              </label>
            </div>

            <div className="role-list-meta-grid">
              <div>
                <span>Joined</span>
                <strong>{formatDate(user.createdAt)}</strong>
              </div>
              <div>
                <span>Last update</span>
                <strong>{formatDate(user.updatedAt)}</strong>
              </div>
            </div>

            <div className="admin-inline-actions">
              <button className="primary-link" disabled={savingUserId === user.id} onClick={() => saveUser(user)} type="button">
                {savingUserId === user.id ? "Saving..." : "Save changes"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}