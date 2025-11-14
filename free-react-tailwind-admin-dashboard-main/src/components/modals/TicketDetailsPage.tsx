import React, { useEffect, useState } from "react";
import { demoRequestStore } from "../../services/demoRequestStore";

export type Activity = {
  id: string;
  at: string; // ISO
  message: string;
};

export type TicketDetailsProps = {
  id: string;
  title: string;
  description?: string;
  requester?: string;
  status?: "open" | "in_progress" | "waiting_approval" | "approved" | "closed";
};

export default function TicketDetailsPage(props: TicketDetailsProps): JSX.Element {
  const { id, title, description = "", requester = "Unknown", status = "open" } = props;

  const [currentStatus, setCurrentStatus] = useState(status);
  const [activities, setActivities] = useState<Activity[]>([
    { id: `${id}-created`, at: new Date().toISOString(), message: `Ticket ${id} created` },
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // initialize from store if exists
    const ex = demoRequestStore.get(id);
    if (ex) {
      setCurrentStatus(ex.status === 'waiting_approval' ? 'waiting_approval' : ex.status === 'approved' ? 'approved' : currentStatus);
    }
    const unsub = demoRequestStore.subscribe(() => {
      const updated = demoRequestStore.get(id);
      if (!updated) return;
      if (updated.status === 'approved') {
        setCurrentStatus('approved');
        setActivities((a) => [
          { id: `${id}-app-${Date.now()}`, at: new Date().toISOString(), message: `Admin approved: ${updated.note || 'Approved'}` },
          ...a,
        ]);
      }
    });
    return () => unsub();
  }, [id]);

  async function onRequestApproval() {
    try {
      setBusy(true);
      setError(null);
      setCurrentStatus("waiting_approval");
      setActivities((a) => [
        { id: `${id}-req-${Date.now()}`, at: new Date().toISOString(), message: `Request sent to admin for approval by ${requester}` },
        ...a,
      ]);

      // push to shared store for admin view
      demoRequestStore.createRequest({ id, title, requester });
    } catch (e: any) {
      setError(e?.message || "Failed to request approval");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl w-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <div className="mt-1 text-sm text-gray-500">Ticket ID: {id}</div>
          <div className="mt-1 text-sm">Requester: <span className="font-medium">{requester}</span></div>
        </div>
        <div className="shrink-0">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${
            currentStatus === "approved" ? "bg-green-50 text-green-700 border-green-200" :
            currentStatus === "waiting_approval" ? "bg-yellow-50 text-yellow-800 border-yellow-200" :
            currentStatus === "in_progress" ? "bg-blue-50 text-blue-700 border-blue-200" :
            currentStatus === "closed" ? "bg-gray-100 text-gray-700 border-gray-200" :
            "bg-indigo-50 text-indigo-700 border-indigo-200"
          }`}>
            {currentStatus.replace("_", " ")}
          </span>
        </div>
      </div>

      {description && (
        <div className="mt-4 p-4 rounded-lg border bg-white">
          <div className="text-sm text-gray-500 mb-1">Description</div>
          <p className="text-sm leading-6 text-gray-800 whitespace-pre-wrap">{description}</p>
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 rounded-md border border-red-200 bg-red-50 text-sm text-red-700">{error}</div>
      )}

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={onRequestApproval}
          disabled={busy || currentStatus === "approved"}
          className={`px-4 py-2 rounded-lg text-sm font-semibold shadow ${busy || currentStatus === "approved" ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-indigo-600 text-white"}`}
        >
          {busy ? "Requesting..." : currentStatus === "approved" ? "Approved" : "Request"}
        </button>
      </div>

      <div className="mt-6">
        <div className="text-sm font-semibold text-gray-700 mb-2">Activity</div>
        <div className="rounded-lg border bg-white divide-y">
          {activities.length === 0 && (
            <div className="p-3 text-sm text-gray-500">No activity yet.</div>
          )}
          {activities.map((act) => (
            <div key={act.id} className="p-3 flex items-start gap-3">
              <div className="mt-0.5 w-2 h-2 rounded-full bg-indigo-400" />
              <div>
                <div className="text-sm text-gray-900">{act.message}</div>
                <div className="text-xs text-gray-500">{new Date(act.at).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
