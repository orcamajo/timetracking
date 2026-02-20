import React from "react";

export function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="loading">
      <span className="spinner" />
      <span style={{ marginLeft: 8 }}>{message}</span>
    </div>
  );
}
