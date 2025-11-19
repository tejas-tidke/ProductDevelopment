// src/pages/DEMO_REQUEST.tsx
import React, { useEffect, useState } from "react";

/*
  Global Final Proposal (Option B variant, but standalone):
  - "Final Proposal" is a top-level button (like "Raise Request")
  - It can be used anytime (not tied to any accepted request)
  - It creates a request whose description JSON contains `finalProposal: { ... }` and `finalOnly: true`
  - Admin UI (existing code) will display that JSON; admin can Approve / Reject it (Approve -> /api/admin/requests/{id}/approve)
*/

type ProposalPayload = {
  vendorName: string;
  productName: string;
  quantity: number;
  price: number;
  department: string;
  role: string;
  totalPrice: number;
};

const emptyProposal = (): ProposalPayload => ({
  vendorName: "",
  productName: "",
  quantity:0,
  price: 0,
  department: "",
  role: "",
  totalPrice:0,
});

function validateProposal(p: ProposalPayload) {
  const errs: Record<string, string> = {};
  if (!p.vendorName.trim()) errs.vendorName = "Vendor name required";
  if (!p.productName.trim()) errs.productName = "Product name required";
  if (!Number.isInteger(p.quantity) || p.quantity <= 0) errs.quantity = "Quantity must be a positive integer (no decimals)";
  if (!Number.isInteger(p.price) || p.price <= 0) errs.price = "Price must be a positive integer (no decimals)";
  if (!p.department.trim()) errs.department = "Department required";
  if (!p.role.trim()) errs.role = "Role required";
  return errs;
}

export default function DEMO_REQUEST(): JSX.Element {
  const [mode, setMode] = useState<"home" | "raise" | "view" | "final">("home");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Raise form (initial request)
  const [raiseForm, setRaiseForm] = useState<ProposalPayload>(emptyProposal());
  const [raiseTouched, setRaiseTouched] = useState<Record<string, boolean>>({});

  // Final proposal (global, standalone)
  const [finalForm, setFinalForm] = useState<ProposalPayload>(emptyProposal());
  const [finalTouched, setFinalTouched] = useState<Record<string, boolean>>({});

  // Requests list for "view"
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // auto-calc totals
  useEffect(() => {
    setRaiseForm((f) => ({ ...f, totalPrice: (Number(f.quantity) || 0) * (Number(f.price) || 0) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raiseForm.quantity, raiseForm.price]);

  useEffect(() => {
    setFinalForm((f) => ({ ...f, totalPrice: (Number(f.quantity) || 0) * (Number(f.price) || 0) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalForm.quantity, finalForm.price]);

  // submit initial (raise) request
  async function submitRaise() {
    setMessage(null);
    setError(null);
    const errs = validateProposal(raiseForm);
    if (Object.keys(errs).length > 0) {
      setRaiseTouched(Object.keys(errs).reduce((a, k) => ({ ...a, [k]: true }), {} as Record<string, boolean>));
      setError("Fix validation errors before submitting.");
      return;
    }

    setSending(true);
    try {
      const payload = {
        title: `${raiseForm.vendorName} — ${raiseForm.productName}`,
        description: JSON.stringify({
          vendorName: raiseForm.vendorName,
          productName: raiseForm.productName,
          quantity: raiseForm.quantity,
          price: raiseForm.price,
          totalPrice: raiseForm.totalPrice,
          department: raiseForm.department,
          role: raiseForm.role,
          // initial requests: finalProposal null
          finalProposal: null,
        }),
        requestedByUserId: null,
      };

      const res = await fetch("/api/requests", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Create failed: ${res.status} ${txt}`);
      }
      const created = await res.json();
      setMessage(`Request created (id: ${created.id}).`);
      setRaiseForm(emptyProposal());
      setRaiseTouched({});
      setMode("view");
      await loadRequests();
    } catch (e: any) {
      setError(e.message || "Failed to create request");
    } finally {
      setSending(false);
    }
  }

  // submit standalone final proposal (global button)
  async function submitFinalProposal() {
    setMessage(null);
    setError(null);
    const errs = validateProposal(finalForm);
    if (Object.keys(errs).length > 0) {
      setFinalTouched(Object.keys(errs).reduce((a, k) => ({ ...a, [k]: true }), {} as Record<string, boolean>));
      setError("Fix validation errors before submitting final proposal.");
      return;
    }

    setSending(true);
    try {
      // We create a new Request that holds the finalProposal in its description and marks finalOnly=true
      const payload = {
        title: `Final Proposal — ${finalForm.vendorName} / ${finalForm.productName}`,
        description: JSON.stringify({
          finalOnly: true,
          finalProposal: {
            vendorName: finalForm.vendorName,
            productName: finalForm.productName,
            quantity: finalForm.quantity,
            price: finalForm.price,
            totalPrice: finalForm.totalPrice,
            department: finalForm.department,
            role: finalForm.role,
          },
        }),
        requestedByUserId: null,
      };

      const res = await fetch("/api/requests", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Final proposal submit failed: ${res.status} ${txt}`);
      }
      const created = await res.json();
      setMessage(`Final proposal submitted (id: ${created.id}). Admin will review it.`);
      setFinalForm(emptyProposal());
      setFinalTouched({});
      setMode("view");
      await loadRequests();
    } catch (e: any) {
      setError(e.message || "Failed to submit final proposal");
    } finally {
      setSending(false);
    }
  }

  // load requests for View
  async function loadRequests() {
    setLoadingRequests(true);
    setError(null);
    try {
      const res = await fetch("/api/requests", { credentials: "include" });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Load failed: ${res.status} ${txt}`);
      }
      const data = await res.json();
      setRequests((data || []).slice().reverse());
    } catch (e: any) {
      setError(e.message || "Failed to load requests");
    } finally {
      setLoadingRequests(false);
    }
  }

  useEffect(() => {
    if (mode === "view") loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // helper to display parsed description (if JSON)
  function RenderParsed({ desc }: { desc?: string }) {
    if (!desc) return <div className="text-sm text-gray-700">—</div>;
    try {
      const parsed = JSON.parse(desc);
      if (parsed.finalOnly && parsed.finalProposal) {
        const p = parsed.finalProposal;
        return (
          <div className="text-sm text-gray-700 grid grid-cols-2 gap-2">
            <div><strong>Vendor</strong><div>{p.vendorName}</div></div>
            <div><strong>Product</strong><div>{p.productName}</div></div>
            <div><strong>Quantity</strong><div>{p.quantity}</div></div>
            <div><strong>Price</strong><div>{p.price}</div></div>
            <div><strong>Total</strong><div>{p.totalPrice}</div></div>
            <div><strong>Department</strong><div>{p.department}</div></div>
            <div><strong>Role</strong><div>{p.role}</div></div>
          </div>
        );
      } else if (parsed.vendorName || parsed.productName) {
        return (
          <div className="text-sm text-gray-700 grid grid-cols-2 gap-2">
            <div><strong>Vendor</strong><div>{parsed.vendorName}</div></div>
            <div><strong>Product</strong><div>{parsed.productName}</div></div>
            <div><strong>Quantity</strong><div>{parsed.quantity}</div></div>
            <div><strong>Price</strong><div>{parsed.price}</div></div>
            <div><strong>Total</strong><div>{parsed.totalPrice}</div></div>
            <div><strong>Department</strong><div>{parsed.department}</div></div>
            <div><strong>Role</strong><div>{parsed.role}</div></div>
            {parsed.finalProposal && (
              <div className="col-span-2 mt-2 p-2 rounded bg-indigo-50 border-l-4 border-indigo-300">
                <div className="text-xs font-semibold text-indigo-800">Embedded Final Proposal</div>
                <div className="text-sm mt-1">
                  <div>Vendor: {parsed.finalProposal.vendorName}</div>
                  <div>Product: {parsed.finalProposal.productName}</div>
                  <div>Quantity: {parsed.finalProposal.quantity}</div>
                  <div>Price: {parsed.finalProposal.price}</div>
                  <div>Total: {parsed.finalProposal.totalPrice}</div>
                  <div>Department: {parsed.finalProposal.department}</div>
                  <div>Role: {parsed.finalProposal.role}</div>
                </div>
              </div>
            )}
          </div>
        );
      } else {
        return <div className="text-sm text-gray-700">{desc}</div>;
      }
    } catch {
      return <div className="text-sm text-gray-700">{desc}</div>;
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Proposal</h1>
          <p className="text-sm text-gray-500 mt-1">
            Raise requests or submit a standalone final proposal 
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={() => { setMode("view"); }} className="px-3 py-2 rounded-md border">View Requests</button>
          <button onClick={() => { setMode("raise"); }} className="px-3 py-2 rounded-md bg-indigo-600 text-white">Raise Request</button>
          <button onClick={() => { setMode("final"); }} className="px-3 py-2 rounded-md bg-rose-600 text-white">Final Proposal</button>
        </div>
      </div>

      {message && <div className="mb-3 p-3 bg-green-50 text-green-700 rounded">{message}</div>}
      {error && <div className="mb-3 p-3 bg-red-50 text-red-700 rounded">{error}</div>}

      {/* RAISE FORM */}
      {mode === "raise" && (
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-medium mb-3">Proposal </h2>
          <div className="grid gap-3">
            <label>
              <div className="text-xs text-gray-600">Vendor name *</div>
              <input value={raiseForm.vendorName} onChange={(e) => setRaiseForm(s => ({ ...s, vendorName: e.target.value }))} className="mt-1 w-full border rounded p-2" />
              {raiseTouched.vendorName && !raiseForm.vendorName && <div className="text-xs text-red-600 mt-1">Vendor required</div>}
            </label>

            <label>
              <div className="text-xs text-gray-600">Product name *</div>
              <input value={raiseForm.productName} onChange={(e) => setRaiseForm(s => ({ ...s, productName: e.target.value }))} className="mt-1 w-full border rounded p-2" />
              {raiseTouched.productName && !raiseForm.productName && <div className="text-xs text-red-600 mt-1">Product required</div>}
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label>
                <div className="text-xs text-gray-600">Quantity (integer) *</div>
                <input value={String(raiseForm.quantity)} onChange={(e) => {
                  const v = e.target.value.trim();
                  if (v === "") setRaiseForm(s => ({ ...s, quantity: 0 }));
                  else {
                    const n = Number(v);
                    if (Number.isInteger(n)) setRaiseForm(s => ({ ...s, quantity: n }));
                  }
                }} className="mt-1 w-full border rounded p-2" />
                {raiseTouched.quantity && validateProposal(raiseForm).quantity && <div className="text-xs text-red-600 mt-1">{validateProposal(raiseForm).quantity}</div>}
              </label>

              <label>
                <div className="text-xs text-gray-600">Price (integer) *</div>
                <input value={String(raiseForm.price)} onChange={(e) => {
                  const v = e.target.value.trim();
                  if (v === "") setRaiseForm(s => ({ ...s, price: 0 }));
                  else {
                    const n = Number(v);
                    if (Number.isInteger(n)) setRaiseForm(s => ({ ...s, price: n }));
                  }
                }} className="mt-1 w-full border rounded p-2" />
                {raiseTouched.price && validateProposal(raiseForm).price && <div className="text-xs text-red-600 mt-1">{validateProposal(raiseForm).price}</div>}
              </label>
            </div>

            <label>
              <div className="text-xs text-gray-600">Department *</div>
              <input value={raiseForm.department} onChange={(e) => setRaiseForm(s => ({ ...s, department: e.target.value }))} className="mt-1 w-full border rounded p-2" />
            </label>

            <label>
              <div className="text-xs text-gray-600">Role *</div>
              <input value={raiseForm.role} onChange={(e) => setRaiseForm(s => ({ ...s, role: e.target.value }))} className="mt-1 w-full border rounded p-2" />
            </label>

            <div>
              <div className="text-xs text-gray-600">Total price (auto)</div>
              <div className="mt-1 font-semibold">{raiseForm.totalPrice}</div>
            </div>

            <div className="flex gap-3 mt-2">
              <button onClick={() => { setRaiseTouched({ vendorName: true, productName: true, quantity: true, price: true, department: true, role: true }); submitRaise(); }} disabled={sending} className="px-4 py-2 bg-indigo-600 text-white rounded-md">{sending ? "Sending..." : "Submit Request"}</button>
              <button onClick={() => { setRaiseForm(emptyProposal()); setRaiseTouched({}); setMessage(null); setError(null); }} className="px-3 py-2 border rounded-md">Reset</button>
            </div>
          </div>
        </div>
      )}

      {/* FINAL PROPOSAL (global) */}
      {mode === "final" && (
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-medium mb-3">Final Proposal (Standalone)</h2>
          <p className="text-xs text-gray-500 mb-3">This final proposal is created as a standalone item and will be visible to Admin for Approve/Reject.</p>

          <div className="grid gap-3">
            <label>
              <div className="text-xs text-gray-600">Vendor name *</div>
              <input value={finalForm.vendorName} onChange={(e) => setFinalForm(s => ({ ...s, vendorName: e.target.value }))} className="mt-1 w-full border rounded p-2" />
              {finalTouched.vendorName && !finalForm.vendorName && <div className="text-xs text-red-600 mt-1">Vendor required</div>}
            </label>

            <label>
              <div className="text-xs text-gray-600">Product name *</div>
              <input value={finalForm.productName} onChange={(e) => setFinalForm(s => ({ ...s, productName: e.target.value }))} className="mt-1 w-full border rounded p-2" />
              {finalTouched.productName && !finalForm.productName && <div className="text-xs text-red-600 mt-1">Product required</div>}
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label>
                <div className="text-xs text-gray-600">Quantity (integer) *</div>
                <input value={String(finalForm.quantity)} onChange={(e) => {
                  const v = e.target.value.trim();
                  if (v === "") setFinalForm(s => ({ ...s, quantity: 0 }));
                  else {
                    const n = Number(v);
                    if (Number.isInteger(n)) setFinalForm(s => ({ ...s, quantity: n }));
                  }
                }} className="mt-1 w-full border rounded p-2" />
                {finalTouched.quantity && validateProposal(finalForm).quantity && <div className="text-xs text-red-600 mt-1">{validateProposal(finalForm).quantity}</div>}
              </label>

              <label>
                <div className="text-xs text-gray-600">Price (integer) *</div>
                <input value={String(finalForm.price)} onChange={(e) => {
                  const v = e.target.value.trim();
                  if (v === "") setFinalForm(s => ({ ...s, price: 0 }));
                  else {
                    const n = Number(v);
                    if (Number.isInteger(n)) setFinalForm(s => ({ ...s, price: n }));
                  }
                }} className="mt-1 w-full border rounded p-2" />
                {finalTouched.price && validateProposal(finalForm).price && <div className="text-xs text-red-600 mt-1">{validateProposal(finalForm).price}</div>}
              </label>
            </div>

            <label>
              <div className="text-xs text-gray-600">Department *</div>
              <input value={finalForm.department} onChange={(e) => setFinalForm(s => ({ ...s, department: e.target.value }))} className="mt-1 w-full border rounded p-2" />
            </label>

            <label>
              <div className="text-xs text-gray-600">Role *</div>
              <input value={finalForm.role} onChange={(e) => setFinalForm(s => ({ ...s, role: e.target.value }))} className="mt-1 w-full border rounded p-2" />
            </label>

            <div>
              <div className="text-xs text-gray-600">Total price (auto)</div>
              <div className="mt-1 font-semibold">{finalForm.totalPrice}</div>
            </div>

            <div className="flex gap-3 mt-2">
              <button onClick={() => { setFinalTouched({ vendorName: true, productName: true, quantity: true, price: true, department: true, role: true }); submitFinalProposal(); }} disabled={sending} className="px-4 py-2 bg-rose-600 text-white rounded-md">{sending ? "Sending..." : "Submit Final Proposal"}</button>
              <button onClick={() => { setFinalForm(emptyProposal()); setFinalTouched({}); setMessage(null); setError(null); }} className="px-3 py-2 border rounded-md">Reset</button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW */}
      {mode === "view" && (
        <div className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium">Raised Items</h2>
            <div className="flex gap-2">
              <button onClick={() => loadRequests()} className="px-3 py-1 rounded-md border">Refresh</button>
              <button onClick={() => { setMode("raise"); }} className="px-3 py-1 rounded-md bg-indigo-600 text-white">Raise New</button>
            </div>
          </div>

          <div className="space-y-3">
            {loadingRequests && <div className="p-3 text-sm text-gray-500">Loading...</div>}
            {!loadingRequests && requests.length === 0 && <div className="p-3 text-sm text-gray-500">No items.</div>}

            {!loadingRequests && requests.map((r) => {
              let parsed: any = null;
              try { parsed = r.description ? JSON.parse(r.description) : null; } catch {}
              const isFinalOnly = parsed?.finalOnly === true;
              const status = (r.status || "PENDING").toUpperCase();
              return (
                <div key={r.id} className={`bg-white border rounded p-4 shadow-sm ${isFinalOnly ? "border-rose-200" : ""}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold">{r.title} <span className="text-xs text-gray-400">#{r.id}</span></div>
                      <div className="text-xs text-gray-500 mt-1">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}</div>

                      <div className="mt-3">
                        <RenderParsed desc={r.description} />
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div>
                        {status === "APPROVED" ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-50 text-green-700 border border-green-200">Accepted</span> :
                          status === "REJECTED" ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-red-50 text-red-700 border border-red-200">Rejected</span> :
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-yellow-50 text-yellow-800 border border-yellow-200">Pending</span>}
                      </div>
                      <div className="text-xs text-gray-400">{r.updatedAt ? `Updated: ${new Date(r.updatedAt).toLocaleString()}` : ""}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}