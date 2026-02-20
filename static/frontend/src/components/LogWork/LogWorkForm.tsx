import React, { useState } from "react";
import { useWorklogs } from "../../hooks/useWorklogs";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { formatTime, parseTimeInput } from "../../utils/time-format";
import { toISODate } from "../../utils/date-utils";

interface LogWorkFormProps {
  issueKey: string;
}

export function LogWorkForm({ issueKey }: LogWorkFormProps) {
  const { data, loading, error, logWork } = useWorklogs(issueKey);
  const [timeInput, setTimeInput] = useState("");
  const [dateInput, setDateInput] = useState(toISODate(new Date()));
  const [commentInput, setCommentInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const seconds = parseTimeInput(timeInput);
    if (!seconds || seconds <= 0) {
      setSubmitError("Enter a valid time (e.g. 2h 30m, 1.5h, or 90)");
      return;
    }

    setSubmitting(true);
    try {
      await logWork(seconds, dateInput, commentInput || undefined);
      setTimeInput("");
      setCommentInput("");
    } catch (err: any) {
      setSubmitError(err.message ?? "Failed to log work");
    } finally {
      setSubmitting(false);
    }
  };

  if (!issueKey) {
    return <div className="error">No issue context available.</div>;
  }

  return (
    <div className="issue-panel">
      <h3>Time Tracking</h3>

      {data && (
        <div className="total-badge">
          Total: {formatTime(data.totalTimeSeconds)}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="time-input">Time spent</label>
          <input
            id="time-input"
            type="text"
            placeholder="e.g. 2h 30m, 1.5h, or 90m"
            value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)}
            disabled={submitting}
          />
        </div>
        <div className="form-group">
          <label htmlFor="date-input">Date</label>
          <input
            id="date-input"
            type="date"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            disabled={submitting}
          />
        </div>
        <div className="form-group">
          <label htmlFor="comment-input">Comment (optional)</label>
          <textarea
            id="comment-input"
            placeholder="What did you work on?"
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            disabled={submitting}
          />
        </div>
        {submitError && <div className="error">{submitError}</div>}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
        >
          {submitting ? "Logging..." : "Log Work"}
        </button>
      </form>

      {loading && <LoadingSpinner message="Loading worklogs..." />}
      {error && <div className="error">{error}</div>}

      {data && data.worklogs.length > 0 && (
        <>
          <h3 style={{ marginTop: 16 }}>Recent Worklogs</h3>
          <ul className="worklog-list">
            {data.worklogs
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.started).getTime() -
                  new Date(a.started).getTime()
              )
              .slice(0, 10)
              .map((wl) => (
                <li key={wl.id} className="worklog-item">
                  <div>
                    <span className="worklog-author">
                      {wl.author.displayName}
                    </span>
                    <br />
                    <span className="worklog-date">
                      {new Date(wl.started).toLocaleDateString()}
                    </span>
                    {wl.comment && (
                      <span
                        style={{
                          color: "var(--color-text-subtle)",
                          marginLeft: 8,
                        }}
                      >
                        — {wl.comment}
                      </span>
                    )}
                  </div>
                  <span className="worklog-time">
                    {formatTime(wl.timeSpentSeconds)}
                  </span>
                </li>
              ))}
          </ul>
        </>
      )}
    </div>
  );
}
