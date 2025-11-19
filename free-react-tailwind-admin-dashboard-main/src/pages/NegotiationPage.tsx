// src/pages/NegotiationPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";

const API_BASE_URL = "http://localhost:8080";

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
  quantity: 0,
  price: 0,
  department: "",
  role: "",
  totalPrice: 0,
});

function validateProposal(p: ProposalPayload) {
  const errs: Record<string, string> = {};
  if (!p.vendorName.trim()) errs.vendorName = "Vendor name required";
  if (!p.productName.trim()) errs.productName = "Product name required";
  if (!Number.isInteger(p.quantity) || p.quantity <= 0)
    errs.quantity = "Quantity must be a positive integer (no decimals)";
  if (!Number.isInteger(p.price) || p.price <= 0)
    errs.price = "Price must be a positive integer (no decimals)";
  if (!p.department.trim()) errs.department = "Department required";
  if (!p.role.trim()) errs.role = "Role required";
  return errs;
}

type RequestItem = {
  id: number | string;
  title: string;
  description?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

function RenderParsed({ desc }: { desc?: string }) {
  if (!desc) return <div className="text-sm text-gray-700">—</div>;
  try {
    const parsed = JSON.parse(desc);
    if (parsed.finalOnly && parsed.finalProposal) {
      const p = parsed.finalProposal;
      return (
        <div className="text-sm text-gray-700 grid grid-cols-2 gap-2">
          <div>
            <strong>Vendor</strong>
            <div>{p.vendorName}</div>
          </div>
          <div>
            <strong>Product</strong>
            <div>{p.productName}</div>
          </div>
          <div>
            <strong>Quantity</strong>
            <div>{p.quantity}</div>
          </div>
          <div>
            <strong>Price</strong>
            <div>{p.price}</div>
          </div>
          <div>
            <strong>Total</strong>
            <div>{p.totalPrice}</div>
          </div>
          <div>
            <strong>Department</strong>
            <div>{p.department}</div>
          </div>
          <div>
            <strong>Role</strong>
            <div>{p.role}</div>
          </div>
        </div>
      );
    } else if (parsed.vendorName || parsed.productName) {
      return (
        <div className="text-sm text-gray-700 grid grid-cols-2 gap-2">
          <div>
            <strong>Vendor</strong>
            <div>{parsed.vendorName}</div>
          </div>
          <div>
            <strong>Product</strong>
            <div>{parsed.productName}</div>
          </div>
          <div>
            <strong>Quantity</strong>
            <div>{parsed.quantity}</div>
          </div>
          <div>
            <strong>Price</strong>
            <div>{parsed.price}</div>
          </div>
          <div>
            <strong>Total</strong>
            <div>{parsed.totalPrice}</div>
          </div>
          <div>
            <strong>Department</strong>
            <div>{parsed.department}</div>
          </div>
          <div>
            <strong>Role</strong>
            <div>{parsed.role}</div>
          </div>
        </div>
      );
    } else {
      return <div className="text-sm text-gray-700">{desc}</div>;
    }
  } catch {
    return <div className="text-sm text-gray-700">{desc}</div>;
  }
}

/** ----- WORKFLOW (left side) ----- */

const WORKFLOW_STAGES = [
  {
    key: "created",
    title: "Request is Created",
    subtitle: "Created by employee",
  },
  {
    key: "preApproval",
    title: "Pre Approval",
    subtitle: "Approved by approver",
  },
  {
    key: "review",
    title: "Request Review Stage",
    subtitle: "Approved by admin",
  },
  {
    key: "negotiation",
    title: "Negotiation Stage",
    subtitle: "Current stage",
  },
  {
    key: "postApproval",
    title: "Post Approval",
    subtitle: "",
  },
  {
    key: "completed",
    title: "Completed",
    subtitle: "",
  },
] as const;

type StageKey = (typeof WORKFLOW_STAGES)[number]["key"];

function Workflow({ current }: { current: StageKey }) {
  const currentIndex = WORKFLOW_STAGES.findIndex((s) => s.key === current);

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <h2 className="text-lg font-medium mb-4">Workflow</h2>
      <ol className="relative border-l border-gray-200 pl-4 space-y-5">
        {WORKFLOW_STAGES.map((stage, idx) => {
          const isCurrent = idx === currentIndex;
          const isCompleted = idx < currentIndex;

          return (
            <li key={stage.key} className="ml-2 relative">
              <span
                className={[
                  "absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full border-2",
                  isCurrent
                    ? "bg-rose-600 border-rose-600"
                    : isCompleted
                    ? "bg-green-500 border-green-500"
                    : "bg-white border-gray-300",
                ].join(" ")}
              ></span>
              <div className="ml-2">
                <div
                  className={[
                    "text-sm font-medium",
                    isCurrent
                      ? "text-rose-600"
                      : isCompleted
                      ? "text-green-700"
                      : "text-gray-700",
                  ].join(" ")}
                >
                  {stage.title}
                </div>
                {stage.subtitle && (
                  <div className="text-xs text-gray-500">
                    {stage.subtitle}
                  </div>
                )}
                {isCurrent && (
                  <div className="text-[11px] text-rose-500 font-semibold mt-1">
                    Current stage
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** ----- PAGE ----- */

export default function NegotiationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [baseRequest, setBaseRequest] = useState<RequestItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [finalForm, setFinalForm] = useState<ProposalPayload>(emptyProposal());
  const [finalTouched, setFinalTouched] = useState<Record<string, boolean>>({});

  // which form mode is active: "raise" or "final"
  const [formMode, setFormMode] = useState<"raise" | "final">("final");

  // Auto-calc total
  useEffect(() => {
    setFinalForm((f) => ({
      ...f,
      totalPrice: (Number(f.quantity) || 0) * (Number(f.price) || 0),
    }));
  }, [finalForm.quantity, finalForm.price]);

  // Fetch the request details by ID and prefill the form
  useEffect(() => {
    async function load() {
      if (!id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/requests/${id}`, {
          credentials: "include",
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Failed to fetch request: ${res.status} ${txt}`);
        }
        const data: RequestItem = await res.json();
        setBaseRequest(data);

        // Try to parse description and prefill proposal
        if (data.description) {
          try {
            const parsed = JSON.parse(data.description);
            setFinalForm((prev) => ({
              ...prev,
              vendorName: parsed.vendorName ?? "",
              productName: parsed.productName ?? "",
              quantity: parsed.quantity ?? 0,
              price: parsed.price ?? 0,
              department: parsed.department ?? "",
              role: parsed.role ?? "",
              totalPrice: (parsed.quantity ?? 0) * (parsed.price ?? 0),
            }));
          } catch {
            // ignore non-JSON descriptions
          }
        }
      } catch (e: any) {
        setError(e.message || "Failed to load request");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  // Submit (raise / final) proposal
 // State to store the first proposal's total price
const [raisedProposalTotalPrice, setRaisedProposalTotalPrice] = useState<number | null>(null);

// Submit proposal
async function submitProposal() {
  setMessage(null);
  setError(null);

  const errs = validateProposal(finalForm);
  if (Object.keys(errs).length > 0) {
    setFinalTouched(
      Object.keys(errs).reduce(
        (a, k) => ({ ...a, [k]: true }),
        {} as Record<string, boolean>
      )
    );
    setError("Fix validation errors before submitting the proposal.");
    return;
  }

  setSending(true);
  try {
    let payload: any;

    if (formMode === "raise") {
      // RAISED PROPOSAL PAYLOAD
      payload = {
        title: `Raised Proposal for #${baseRequest?.id} — ${finalForm.vendorName} / ${finalForm.productName}`,
        description: JSON.stringify({
          fromRequestId: baseRequest?.id,
          type: "RAISED_PROPOSAL",
          proposal: {
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

      // Save the raised proposal total price in state
      setRaisedProposalTotalPrice(finalForm.totalPrice);

    } else {
      // FINAL PROPOSAL PAYLOAD
      payload = {
        title: `Final Proposal for #${baseRequest?.id} — ${finalForm.vendorName} / ${finalForm.productName}`,
        description: JSON.stringify({
          fromRequestId: baseRequest?.id,
          type: "FINAL_PROPOSAL",
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
    }

    // Send proposal to the backend
    const res = await fetch(`${API_BASE_URL}/api/requests`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Proposal submit failed: ${res.status} ${txt}`);
    }

    const created = await res.json();
    setFinalTouched({});

    // If it was a final proposal, show the price difference
    if (formMode === "final" && raisedProposalTotalPrice !== null) {
      const priceDifference = finalForm.totalPrice - raisedProposalTotalPrice;
      setMessage(`Final proposal submitted (id: ${created.id}). Price difference: ${priceDifference}`);
    } else {
      setMessage(`Proposal raised (id: ${created.id}). Approver/Admin can review it.`);
    }

    navigate(`/requests/${created.id}`);
  } catch (e: any) {
    setError(e.message || "Failed to submit proposal");
  } finally {
    setSending(false);
  }
}

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex gap-8">
        {/* LEFT: WORKFLOW */}
        <aside className="w-64 flex-shrink-0">
          <Workflow current="negotiation" />
        </aside>

        {/* RIGHT: MAIN CONTENT */}
        <main className="flex-1">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold">
              Negotiation {baseRequest ? `for #${baseRequest.id}` : ""}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Review the original request and submit your proposal.
            </p>
          </div>

          {loading && (
            <div className="mb-3 p-3 bg-gray-50 rounded">Loading...</div>
          )}
          {message && (
            <div className="mb-3 p-3 bg-green-50 text-green-700 rounded">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-3 p-3 bg-red-50 text-red-700 rounded">
              {error}
            </div>
          )}

          {baseRequest && (
            <div className="mb-6 bg-white border rounded-lg p-4 shadow-sm">
              <h2 className="text-lg font-medium mb-2">Original Request</h2>
              <div className="text-sm font-semibold">
                {baseRequest.title}{" "}
                <span className="text-xs text-gray-400">
                  #{baseRequest.id}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {baseRequest.createdAt
                  ? new Date(baseRequest.createdAt).toLocaleString()
                  : ""}
              </div>
              <div className="mt-3">
                <RenderParsed desc={baseRequest.description} />
              </div>
            </div>
          )}

          {/* FORM MODE TOGGLE */}
          <div className="mb-3 flex gap-2">
            <button
              type="button"
              onClick={() => setFormMode("raise")}
              className={`px-4 py-2 rounded-md border text-sm ${
                formMode === "raise"
                  ? "bg-rose-600 text-white border-rose-600"
                  : "bg-white text-gray-700 border-gray-300"
              }`}
            >
              Raise Proposal
            </button>
            <button
              type="button"
              onClick={() => setFormMode("final")}
              className={`px-4 py-2 rounded-md border text-sm ${
                formMode === "final"
                  ? "bg-rose-600 text-white border-rose-600"
                  : "bg-white text-gray-700 border-gray-300"
              }`}
            >
              Final Proposal
            </button>
          </div>

          {/* PROPOSAL FORM */}
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <h2 className="text-lg font-medium mb-3">
              {formMode === "final" ? "Final Proposal" : "Raise Proposal"}
            </h2>
            <p className="text-xs text-gray-500 mb-3">
              These details will be sent as a{" "}
              {formMode === "final" ? "final" : "raised"} proposal linked to
              this request.
            </p>

            <div className="grid gap-3">
              <label>
                <div className="text-xs text-gray-600">Vendor name *</div>
                <input
                  value={finalForm.vendorName}
                  onChange={(e) =>
                    setFinalForm((s) => ({
                      ...s,
                      vendorName: e.target.value,
                    }))
                  }
                  className="mt-1 w-full border rounded p-2"
                />
                {finalTouched.vendorName && !finalForm.vendorName && (
                  <div className="text-xs text-red-600 mt-1">
                    Vendor required
                  </div>
                )}
              </label>

              <label>
                <div className="text-xs text-gray-600">Product name *</div>
                <input
                  value={finalForm.productName}
                  onChange={(e) =>
                    setFinalForm((s) => ({
                      ...s,
                      productName: e.target.value,
                    }))
                  }
                  className="mt-1 w-full border rounded p-2"
                />
                {finalTouched.productName && !finalForm.productName && (
                  <div className="text-xs text-red-600 mt-1">
                    Product required
                  </div>
                )}
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label>
                  <div className="text-xs text-gray-600">
                    Quantity (integer) *
                  </div>
                  <input
                    value={String(finalForm.quantity)}
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      if (v === "") setFinalForm((s) => ({ ...s, quantity: 0 }));
                      else {
                        const n = Number(v);
                        if (Number.isInteger(n))
                          setFinalForm((s) => ({ ...s, quantity: n }));
                      }
                    }}
                    className="mt-1 w-full border rounded p-2"
                  />
                  {finalTouched.quantity &&
                    validateProposal(finalForm).quantity && (
                      <div className="text-xs text-red-600 mt-1">
                        {validateProposal(finalForm).quantity}
                      </div>
                    )}
                </label>

                <label>
                  <div className="text-xs text-gray-600">
                    Price (integer) *
                  </div>
                  <input
                    value={String(finalForm.price)}
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      if (v === "") setFinalForm((s) => ({ ...s, price: 0 }));
                      else {
                        const n = Number(v);
                        if (Number.isInteger(n))
                          setFinalForm((s) => ({ ...s, price: n }));
                      }
                    }}
                    className="mt-1 w-full border rounded p-2"
                  />
                  {finalTouched.price &&
                    validateProposal(finalForm).price && (
                      <div className="text-xs text-red-600 mt-1">
                        {validateProposal(finalForm).price}
                      </div>
                    )}
                </label>
              </div>

              <label>
                <div className="text-xs text-gray-600">Department *</div>
                <input
                  value={finalForm.department}
                  onChange={(e) =>
                    setFinalForm((s) => ({
                      ...s,
                      department: e.target.value,
                    }))
                  }
                  className="mt-1 w-full border rounded p-2"
                />
              </label>

              <label>
                <div className="text-xs text-gray-600">Role *</div>
                <input
                  value={finalForm.role}
                  onChange={(e) =>
                    setFinalForm((s) => ({ ...s, role: e.target.value }))
                  }
                  className="mt-1 w-full border rounded p-2"
                />
              </label>

              <div>
                <div className="text-xs text-gray-600">Total price (auto)</div>
                <div className="mt-1 font-semibold">
                  {finalForm.totalPrice}
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => {
                    setFinalTouched({
                      vendorName: true,
                      productName: true,
                      quantity: true,
                      price: true,
                      department: true,
                      role: true,
                    });
                    submitProposal();
                  }}
                  disabled={sending || loading}
                  className="px-4 py-2 bg-rose-600 text-white rounded-md disabled:opacity-60"
                >
                  {sending
                    ? "Sending..."
                    : formMode === "final"
                    ? "Submit Final Proposal"
                    : "Submit Raised Proposal"}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
