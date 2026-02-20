import React from "react";
import { JiraUser } from "../../api/bridge";

interface UserPickerProps {
  users: JiraUser[];
  selectedAccountId: string | undefined;
  onChange: (accountId: string | undefined) => void;
}

export function UserPicker({
  users,
  selectedAccountId,
  onChange,
}: UserPickerProps) {
  return (
    <select
      value={selectedAccountId ?? ""}
      onChange={(e) => onChange(e.target.value || undefined)}
      style={{ padding: "4px 8px", fontSize: 13, minWidth: 160 }}
    >
      <option value="">All users</option>
      {users.map((user) => (
        <option key={user.accountId} value={user.accountId}>
          {user.displayName}
        </option>
      ))}
    </select>
  );
}
