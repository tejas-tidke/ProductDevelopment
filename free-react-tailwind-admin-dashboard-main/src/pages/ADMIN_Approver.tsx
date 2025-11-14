// src/pages/ADMIN_Approver.tsx
import React, { useEffect, useState } from "react";

interface RequestType {
  id: number | string;
  title: string;
  description?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  createdAt?: string;
  updatedAt?: string;
  requestedByUserId?: number | null;
}

const parseDescription = (desc?: string): any | null => {
  if (!desc) return null;
  try {
    return JSON.parse(desc);
  } catch {
    return null;
  }
};

const mapBackendStatusToUi = (status: string): string => {
  if (!status) return "unknown";
  const s = status.toUpperCase();
  if (s === "APPROVED") return "accepted";
  if (s === "REJECTED") return "rejected";
  if (s === "PENDING") return "waiting";
  return s.toLowerCase();
};

export default function ADMIN_Approver(): JSX.Element {
  const [list, setList] = useState<RequestType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showRequests, setShowRequests] = useState(false);

  const load = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/requests", { credentials: "include" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to load requests (${res.status}) — response: ${text}`);
      }
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Expected JSON but server returned: ${text}`);
      }
      const data = await res.json();
      setList((data || []).slice().reverse());
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isFinal = (status?: string): boolean => {
    const s = status?.toUpperCase();
    return s === "APPROVED" || s === "REJECTED";
  };

  // Admin accepts initial request (labelled Accept in UI) -> call existing approve endpoint
  const acceptRequest = async (id: number | string, currentStatus?: string): Promise<void> => {
    if (isFinal(currentStatus)) return;
    setBusyId(String(id));
    try {
      const res = await fetch(`/api/admin/requests/${id}/approve`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Accept failed: ${res.status} ${text}`);
      }
      await load();
    } catch (e: any) {
      setError(e.message || "Accept failed");
    } finally {
      setBusyId(null);
    }
  };

  const rejectRequest = async (id: number | string, currentStatus?: string, isFinalBlock = false): Promise<void> => {
    if (isFinal(currentStatus)) return;
    setBusyId(String(id));
    try {
      const res = await fetch(`/api/admin/requests/${id}/reject`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Reject failed: ${res.status} ${text}`);
      }
      await load();
    } catch (e: any) {
      setError(e.message || "Reject failed");
    } finally {
      setBusyId(null);
    }
  };

  // Approve final proposal (uses same approve endpoint)
  const approveFinalProposal = async (id: number | string, currentStatus?: string): Promise<void> => {
    if (isFinal(currentStatus)) return;
    setBusyId(String(id));
    try {
      const res = await fetch(`/api/admin/requests/${id}/approve`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Final approve failed: ${res.status} ${text}`);
      }
      await load();
    } catch (e: any) {
      setError(e.message || "Final approve failed");
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = list.filter((r) => (r.status || "PENDING").toUpperCase() === "PENDING").length;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">ADMIN Approver</h1>
      <p className="text-sm text-gray-500 mt-1">
        Accept or reject incoming requests. After you accept an initial request the requester may submit a final proposal for your approval.
      </p>

      {error && (
        <div className="mt-3 p-3 bg-red-50 text-red-700 rounded" role="alert">
          {error}
        </div>
      )}

      {!showRequests && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <div className="text-yellow-800 font-medium">🔔 {pendingCount} new request(s) need attention</div>
          <button onClick={() => setShowRequests(true)} className="mt-2 px-3 py-2 bg-blue-600 text-white rounded">
            View Requests
          </button>
        </div>
      )}

      {showRequests && (
        <div className="mt-4 bg-white border rounded-lg divide-y">
          {loading && <div className="p-4 text-sm text-gray-500">Loading requests...</div>}

          {!loading && list.length === 0 && <div className="p-4 text-sm text-gray-500">No incoming requests.</div>}

          {list.map((r) => {
            const desc = parseDescription(r.description);
            const statusUi = mapBackendStatusToUi(r.status as string);
            const finalProposal = desc?.finalProposal ?? null;
            const isReqFinal = isFinal(r.status);
            const busy = busyId === String(r.id);

            return (
              <div key={r.id} className="p-4 flex flex-col gap-3 border-b">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {r.id} — {r.title}
                    </div>
                    <div className="text-xs text-gray-500">Requester: {r.requestedByUserId ?? "—"}</div>
                    <div className="text-xs mt-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                          statusUi === "accepted"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : statusUi === "waiting"
                            ? "bg-yellow-50 text-yellow-800 border-yellow-200"
                            : "bg-gray-50 text-gray-700 border-gray-200"
                        }`}
                      >
                        {statusUi.replace("_", " ")}
                      </span>
                    </div>

                    {/* Details — same as user view */}
                    <div className="mt-3 text-sm text-gray-700 grid grid-cols-2 gap-2">
                      {desc ? (
                        <>
                          <div>
                            <strong>Vendor</strong>
                            <div>{desc.vendorName}</div>
                          </div>
                          <div>
                            <strong>Product</strong>
                            <div>{desc.productName}</div>
                          </div>
                          <div>
                            <strong>Quantity</strong>
                            <div>{desc.quantity}</div>
                          </div>
                          <div>
                            <strong>Price</strong>
                            <div>{desc.price}</div>
                          </div>
                          <div>
                            <strong>Total</strong>
                            <div>{desc.totalPrice}</div>
                          </div>
                          <div>
                            <strong>Department</strong>
                            <div>{desc.department}</div>
                          </div>
                          <div>
                            <strong>Role</strong>
                            <div>{desc.role}</div>
                          </div>
                        </>
                      ) : (
                        <div className="col-span-2 text-sm text-gray-700">{r.description}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {/* Initial request actions: Accept / Reject (labelled Accept but calls /approve) */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => acceptRequest(r.id, r.status)}
                        disabled={isReqFinal || busy}
                        className={`px-3 py-1.5 text-sm rounded ${
                          isReqFinal ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-green-600 text-white"
                        }`}
                      >
                        {busy ? "Working..." : "Accept"}
                      </button>

                      <button
                        onClick={() => rejectRequest(r.id, r.status)}
                        disabled={isReqFinal || busy}
                        className={`px-3 py-1.5 text-sm rounded ${
                          isReqFinal ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-red-600 text-white"
                        }`}
                      >
                        {busy ? "Working..." : "Reject"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Final proposal block (if user submitted one) */}
                {finalProposal && (
                  <div className="p-3 mt-2 border rounded bg-indigo-50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-indigo-800">Final Proposal</div>
                        <div className="text-xs text-indigo-700 mt-1">(Submitted by user after Accept)</div>

                        <div className="mt-2 text-sm text-gray-800 grid grid-cols-2 gap-2">
                          <div>
                            <strong>Vendor</strong>
                            <div>{finalProposal.vendorName}</div>
                          </div>
                          <div>
                            <strong>Product</strong>
                            <div>{finalProposal.productName}</div>
                          </div>
                          <div>
                            <strong>Quantity</strong>
                            <div>{finalProposal.quantity}</div>
                          </div>
                          <div>
                            <strong>Price</strong>
                            <div>{finalProposal.price}</div>
                          </div>
                          <div>
                            <strong>Total</strong>
                            <div>{finalProposal.totalPrice}</div>
                          </div>
                          <div>
                            <strong>Department</strong>
                            <div>{finalProposal.department}</div>
                          </div>
                          <div>
                            <strong>Role</strong>
                            <div>{finalProposal.role}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => approveFinalProposal(r.id, r.status)}
                          disabled={isReqFinal || busy}
                          className={`px-3 py-1.5 text-sm rounded ${
                            isReqFinal ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white"
                          }`}
                        >
                          {busy ? "Working..." : "Approve"}
                        </button>

                        <button
                          onClick={() => rejectRequest(r.id, r.status, true)}
                          disabled={isReqFinal || busy}
                          className={`px-3 py-1.5 text-sm rounded ${
                            isReqFinal ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-red-600 text-white"
                          }`}
                        >
                          {busy ? "Working..." : "Reject"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showRequests && (
        <div className="mt-4">
          <button
            onClick={() => {
              load();
              setShowRequests(false);
            }}
            className="px-3 py-1 rounded border"
          >
            Hide Requests
          </button>
        </div>
      )}
    </div>
  );
}
