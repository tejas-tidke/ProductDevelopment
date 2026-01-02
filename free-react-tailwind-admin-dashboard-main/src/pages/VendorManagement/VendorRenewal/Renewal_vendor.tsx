import React, { useEffect, useMemo, useState } from "react";
import PrimaryButton from "../../../components/ui/button/PrimaryButton";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../../components/ui/table";

/** Backend DTO */
type ContractDetails = {
  id?: number | string;
  existingContractId?: string | null;
  jiraIssueKey?: string | null;
  issueKey?: string | null;
  issue_key?: string | null;
  // other fields possibly present; we conservatively allow any
  nameOfVendor?: string | null;
  productName?: string | null;
  renewalDate?: string | null;
  requesterName?: string | null;
  totalValueUsd?: number | null;
  totalValue?: number | null;
  total_value?: number | null;
  totalValueString?: string | null;
  // sometimes backends include embedded proposals or finalProposalTotal
  finalProposalTotal?: number | string | null;
  proposals?: any;
  [key: string]: any;
};

/* UI Row */
interface RenewalItem {
  id: string;
  vendorName: string;
  product: string;
  renewalDeadline: string;
  daysUntilRenewal: number | null;
  renewalStage: "Active" | "Expired";
  owner: string;
  totalValue: string;
  originalContract: ContractDetails; // Store original contract data for renewal
}

/* Helpers */
const formatDateDisplay = (iso?: string | null): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const calculateDaysUntil = (iso?: string | null): number | null => {
  if (!iso) return null;
  const target = new Date(iso);
  if (isNaN(target.getTime())) return null;
  const now = new Date();
  const t = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  const n = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil((t - n) / (1000 * 60 * 60 * 24));
};

/* Determine NEW STAGE */
const computeStage = (days: number | null): "Active" | "Expired" => {
  if (days === null) return "Expired";
  if (days <= 30) return "Expired";
  if (days > 30 && days <= 90) return "Active";
  return "Active";
};

/* DTO -> UI Row mapper */
const mapContractToRenewalItem = (c: ContractDetails): RenewalItem => {
  const rawId = c.id ?? c.existingContractId ?? c.key ?? "unknown";
  const idStr = String(rawId).startsWith("C-") ? String(rawId) : `C-${String(rawId)}`;

  const vendorName = c.nameOfVendor ?? c.vendor ?? "Unknown";
  const product = c.productName ?? c.product ?? "Unknown";

  const renewalDeadlineFormatted = formatDateDisplay(c.renewalDate) ?? "N/A";
  const daysUntil = calculateDaysUntil(c.renewalDate);

  const renewalStage = computeStage(daysUntil);

  const owner = c.requesterName ?? c.requester ?? "N/A";

  const totalNumber = c.totalValueUsd ?? c.totalValue ?? c.total_value;
  const totalValueFallback =
    totalNumber !== undefined && totalNumber !== null
      ? Number(totalNumber).toLocaleString()
      : c.totalValueString ?? "N/A";

  // initially use fallback; we'll try to replace with final-proposal value async
  return {
    id: idStr,
    vendorName,
    product,
    renewalDeadline: renewalDeadlineFormatted,
    daysUntilRenewal: daysUntil,
    renewalStage,
    owner,
    totalValue: totalValueFallback,
    originalContract: c, // Store original contract for renewal
  };
};

/* Utility to find issueKey on returned contract object reliably */
const extractIssueKeyFromContract = (c: ContractDetails): string | null => {
  // Try several likely property names
  const possible =
    c.issueKey ??
    c.jiraIssueKey ??
    c.issue_key ??
    (c as any).jira_issue_key ??
    (c as any).issue ??
    null;
  if (!possible) return null;
  return String(possible);
};


/* Fetch final proposal for a given issueKey and return numeric totalCost or null */
const fetchFinalProposalTotal = async (issueKey: string): Promise<number | null> => {
  try {
    const resp = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/jira/proposals/issue/${encodeURIComponent(issueKey)}`);
    if (!resp.ok) {
      // no proposals or endpoint unavailable
      return null;
    }
    const data = await resp.json();
    if (!data) return null;
    const proposals = Array.isArray(data) ? data : [data];

    if (!proposals.length) return null;

    // Find the final proposal
    let finalProposal = proposals.find((p: any) => p.isFinal === true);
    
    // If no final proposal found, use the last proposal
    if (!finalProposal && proposals.length > 0) {
      finalProposal = proposals[proposals.length - 1];
    }

    if (!finalProposal) return null;
    
    const tc =
      finalProposal.totalCost ??
      finalProposal.total_cost ??
      ((finalProposal.unitCost && finalProposal.licenseCount)
        ? Number(finalProposal.unitCost) * Number(finalProposal.licenseCount)
        : null);

    if (tc === null || tc === undefined) return null;
    const num = Number(tc);
    return isNaN(num) ? null : num;
  } catch (err) {
    console.warn("fetchFinalProposalTotal error:", err);
    return null;
  }
};

const Renewal_vendor: React.FC = () => {
  const [rows, setRows] = useState<RenewalItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  /** New filter state */
  const [stageFilter, setStageFilter] = useState<"All" | "Active" | "Expired">("All");
  const [showFilterMenu, setShowFilterMenu] = useState<boolean>(false);

  /** Renewal state */
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);

  /* Helper to enforce the <= 90 rule */
  const keepWithin90Days = (item: RenewalItem) => {
    return item.daysUntilRenewal !== null && item.daysUntilRenewal <= 90;
  };

  /* Initial fetch & enrichment (adds final-proposal price if available) */
  useEffect(() => {
    let mounted = true;

    const fetchAndEnrich = async () => {
      try {
        setLoading(true);
        setError(null);

        const resp = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/jira/contracts/completed`);
        if (!resp.ok) {
          const txt = await resp.text().catch(() => "");
          throw new Error(`Failed to fetch: ${resp.status} ${resp.statusText} ${txt}`);
        }
        const data: ContractDetails[] = await resp.json();
        const mappedAll = Array.isArray(data) ? data.map(mapContractToRenewalItem) : [];

        // Enrich each mapped row by attempting to read the final proposal total (if issueKey present)
        const enriched = await Promise.all(
          (mappedAll.map(async (row, idx) => {
            // original contract object for discovery of issueKey / finalProposalTotal
            const original = Array.isArray(data) ? data[idx] : undefined;
            // if backend already provided a finalProposalTotal (common optimization), use it
            const preExisting = original && (original.finalProposalTotal ?? original.final_proposal_total ?? original.finalProposalPrice ?? original.finalProposalAmount);
            if (preExisting !== undefined && preExisting !== null && String(preExisting).trim() !== "") {
              const n = Number(preExisting);
              if (!isNaN(n)) {
                row.totalValue = n.toLocaleString();
                return row;
              }
            }

            // Try to find an issueKey on the contract object
            const issueKey = original ? extractIssueKeyFromContract(original) : null;
            if (!issueKey) {
              // no issue key - keep fallback totalValue already set
              return row;
            }

            // fetch final proposal total for this issueKey
            const finalTotal = await fetchFinalProposalTotal(issueKey);
            if (finalTotal !== null) {
              row.totalValue = Number(finalTotal).toLocaleString();
            }
            return row;
          }))
        );

        // Filter to <= 90 as required
        const filtered = enriched.filter(keepWithin90Days);
        if (mounted) setRows(filtered);
      } catch (err) {
        console.error("Initial fetch error:", err);
        if (mounted) {
          setError("Failed to load renewals.");
          setRows([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAndEnrich();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Polling & Event listener:
   * when new request is created we refresh and when issue moves to terminal state
   * we fetch contracts by issueKey and merge (but only include <=90 days).
   */
  useEffect(() => {
    const pollRegistry = new Map<string, { intervalId: number | null; attempts: number }>();
    const POLL_INTERVAL_MS = 15000;
    const MAX_ATTEMPTS = 40;

    const checkIssueStatus = async (issueKey: string): Promise<string | null> => {
      try {
        const resp = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/jira/issues/${encodeURIComponent(issueKey)}`);
        if (!resp.ok) {
          console.warn("checkIssueStatus non-ok", resp.status);
          return null;
        }
        const data = await resp.json();
        const status =
          (data && data.fields && (data.fields as any).status && (data.fields as any).status.name) ||
          data.status ||
          data.issueStatus ||
          (data && (data.status && data.status.name)) ||
          null;
        return status ? String(status) : null;
      } catch (err) {
        console.error("checkIssueStatus error:", err);
        return null;
      }
    };

    const fetchContractForIssue = async (issueKey: string): Promise<ContractDetails[] | null> => {
      try {
        const resp = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/jira/contracts/byIssueKey/${encodeURIComponent(issueKey)}`);
        if (!resp.ok) {
          console.warn("fetchContractForIssue non-ok", resp.status);
          return null;
        }
        const data = await resp.json();
        if (!data) return null;
        return Array.isArray(data) ? data : [data];
      } catch (err) {
        console.error("fetchContractForIssue error:", err);
        return null;
      }
    };

    const isTerminal = (statusRaw?: string | null) => {
      if (!statusRaw) return false;
      const s = statusRaw.toLowerCase();
      return ["done", "completed", "closed", "resolved", "finished"].some((t) => s.includes(t));
    };

    const startPollingForIssue = (issueKey: string) => {
      if (!issueKey) return;
      if (pollRegistry.has(issueKey)) return;

      const state = { intervalId: null as number | null, attempts: 0 };
      pollRegistry.set(issueKey, state);

      const runOnce = async () => {
        const entry = pollRegistry.get(issueKey);
        if (!entry) return;

        entry.attempts += 1;
        try {
          const status = await checkIssueStatus(issueKey);
          if (isTerminal(status)) {
            const contracts = await fetchContractForIssue(issueKey);
            if (contracts && contracts.length) {
              const mapped = contracts.map(mapContractToRenewalItem);

              // enrich those mapped entries with first proposal totals where possible
              const enriched = await Promise.all(
                mapped.map(async (m, idx) => {
                  const orig = contracts[idx];
                  // if orig contains finalProposalTotal, use it
                  const preExisting = orig && (orig.finalProposalTotal ?? orig.final_proposal_total ?? orig.finalProposalPrice ?? orig.finalProposalAmount);
                  if (preExisting !== undefined && preExisting !== null && String(preExisting).trim() !== "") {
                    const n = Number(preExisting);
                    if (!isNaN(n)) {
                      m.totalValue = n.toLocaleString();
                      return m;
                    }
                  }
                  const issueKeyFromContract = extractIssueKeyFromContract(orig) ?? issueKey;
                  if (issueKeyFromContract) {
                    const ft = await fetchFinalProposalTotal(issueKeyFromContract);
                    if (ft !== null) m.totalValue = Number(ft).toLocaleString();
                  }
                  return m;
                })
              );

              setRows((prev) => {
                const next = [...prev];
                enriched.forEach((m) => {
                  if (!keepWithin90Days(m)) return;
                  const idx = next.findIndex((r) => r.id === m.id);
                  if (idx >= 0) next[idx] = { ...next[idx], ...m };
                  else next.unshift(m);
                });
                return next.filter(keepWithin90Days);
              });
            } else {
              // fallback refresh
              try {
                const resp = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/jira/contracts/completed`);
                if (resp.ok) {
                  const data = await resp.json();
                  const mappedAll = Array.isArray(data) ? data.map(mapContractToRenewalItem) : [];
                  // enrich mappedAll with final proposal totals where possible
                  const enrichedAll = await Promise.all(
                    mappedAll.map(async (row, idx) => {
                      const orig = Array.isArray(data) ? data[idx] : undefined;
                      if (!orig) return row;
                      const preExisting = orig && (orig.finalProposalTotal ?? orig.final_proposal_total);
                      if (preExisting !== undefined && preExisting !== null) {
                        const n = Number(preExisting);
                        if (!isNaN(n)) {
                          row.totalValue = n.toLocaleString();
                          return row;
                        }
                      }
                      const ik = extractIssueKeyFromContract(orig);
                      if (ik) {
                        const ft = await fetchFinalProposalTotal(ik);
                        if (ft !== null) row.totalValue = Number(ft).toLocaleString();
                      }
                      return row;
                    })
                  );
                  setRows(enrichedAll.filter(keepWithin90Days));
                }
              } catch (err) {
                console.error("fallback refresh error", err);
              }
            }

            // done polling
            const e = pollRegistry.get(issueKey);
            if (e && e.intervalId) {
              window.clearInterval(e.intervalId);
            }
            pollRegistry.delete(issueKey);
            return;
          }

          if (entry.attempts >= MAX_ATTEMPTS) {
            console.warn(`Polling stopped for ${issueKey} after max attempts`);
            const e = pollRegistry.get(issueKey);
            if (e && e.intervalId) window.clearInterval(e.intervalId);
            pollRegistry.delete(issueKey);
            return;
          }
        } catch (err) {
          console.error("poll runOnce error", err);
        }
      };

      runOnce();
      const id = window.setInterval(runOnce, POLL_INTERVAL_MS);
      state.intervalId = id;
      pollRegistry.set(issueKey, state);
    };

    const onRequestCreated = (e: Event) => {
      const evt = e as CustomEvent;
      const issueKey = evt?.detail?.issueKey as string | undefined;

      // Refresh list (and re-enrich)
      (async () => {
        try {
          const resp = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/jira/contracts/completed`);
          if (resp.ok) {
            const data: ContractDetails[] = await resp.json();
            const mappedAll = Array.isArray(data) ? data.map(mapContractToRenewalItem) : [];
            // attempt to enrich mappedAll with final proposal totals
            const enrichedAll = await Promise.all(
              mappedAll.map(async (row, idx) => {
                const orig = Array.isArray(data) ? data[idx] : undefined;
                if (!orig) return row;
                const preExisting = orig && (orig.finalProposalTotal ?? orig.final_proposal_total);
                if (preExisting !== undefined && preExisting !== null) {
                  const n = Number(preExisting);
                  if (!isNaN(n)) {
                    row.totalValue = n.toLocaleString();
                    return row;
                  }
                }
                const ik = extractIssueKeyFromContract(orig);
                if (ik) {
                  const ft = await fetchFinalProposalTotal(ik);
                  if (ft !== null) row.totalValue = Number(ft).toLocaleString();
                }
                return row;
              })
            );
            setRows(enrichedAll.filter(keepWithin90Days));
          }
        } catch (err) {
          console.error("refresh after request created failed", err);
        }
      })();

      if (issueKey) {
        startPollingForIssue(issueKey);
      }
    };

    window.addEventListener("requestCreated", onRequestCreated as EventListener);

    return () => {
      window.removeEventListener("requestCreated", onRequestCreated as EventListener);
      pollRegistry.forEach((v) => {
        if (v.intervalId) window.clearInterval(v.intervalId);
      });
      pollRegistry.clear();
    };
  }, []);

  /* FILTER + SEARCH */
  const filteredRenewals = useMemo(() => {
    let list = rows;

    if (stageFilter !== "All") {
      list = list.filter((r) => r.renewalStage === stageFilter);
    }

    const term = searchTerm.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (r) =>
          r.vendorName.toLowerCase().includes(term) ||
          r.product.toLowerCase().includes(term) ||
          r.id.toLowerCase().includes(term)
      );
    }
    return list;
  }, [searchTerm, stageFilter, rows]);

  const handleExportCSV = () => {
    if (!filteredRenewals.length) {
      alert("No data to export.");
      return;
    }

    const headers = [
      "Renewal ID",
      "Vendor Name",
      "Product(s)",
      "Renewal Deadline",
      "Days Until Renewal",
      "Renewal Stage",
      "Owner",
      "Total Value (USD)",
    ];

    const escapeCell = (val: string) => `"${val.replace(/"/g, '""')}"`;

    const rowsCsv = filteredRenewals.map((r) =>
      [
        r.id,
        r.vendorName,
        r.product,
        r.renewalDeadline,
        r.daysUntilRenewal ?? "",
        r.renewalStage,
        r.owner,
        r.totalValue,
      ]
        .map(String)
        .map(escapeCell)
        .join(",")
    );

    const csv = [headers.map(escapeCell).join(","), ...rowsCsv].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `renewals-${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderStageBadge = (stage: RenewalItem["renewalStage"]) => {
    const base =
      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border";
    if (stage === "Expired") {
      return <span className={`${base} border-red-200 bg-red-50 text-red-600`}>Expired</span>;
    }
    return <span className={`${base} border-green-200 bg-green-50 text-green-600`}>Active</span>;
  };

  const triggerRenewal = (contract: RenewalItem) => {
  if (!contract) return;

  const contractId =
    contract.originalContract.id ||
    contract.originalContract.existingContractId ||
    contract.id.replace("C-", "");

  window.dispatchEvent(
    new CustomEvent("openCreateModal", {
      detail: { existingContractId: contractId },
    })
  );
};


  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-gray-400 tracking-wide mb-1">VENDOR MANAGEMENT &gt; RENEWALS</div>
              <h1 className="text-2xl font-semibold text-gray-900">Renewals</h1>
            </div>

            <div className="flex items-center space-x-3">
            <PrimaryButton
  onClick={() => {
    const contract = rows.find(r => r.id === selectedContractId);
    if (contract) {
      triggerRenewal(contract);
    }
  }}
  disabled={!selectedContractId}
  className={`inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium ${
    !selectedContractId
      ? "opacity-50 cursor-not-allowed"
      : "bg-indigo-600 hover:bg-indigo-700"
  }`}
>
  Renewal
</PrimaryButton>

              <div className="relative">
                <button
                  onClick={() => setShowFilterMenu((p) => !p)}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Filters
                </button>

                {showFilterMenu && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg z-20">
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      onClick={() => {
                        setStageFilter("All");
                        setShowFilterMenu(false);
                      }}
                    >
                      All
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      onClick={() => {
                        setStageFilter("Active");
                        setShowFilterMenu(false);
                      }}
                    >
                      Active
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      onClick={() => {
                        setStageFilter("Expired");
                        setShowFilterMenu(false);
                      }}
                    >
                      Expired
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={handleExportCSV}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Export CSV
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4 w-80 relative">
            <input
              type="text"
              placeholder="Search"
              className="w-full border px-3 py-2 rounded-md pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          </div>
        </div>

        {/* TABLE */}
        <div className="border border-gray-200 rounded-lg bg-white shadow-sm" style={{ height: '65vh' }}>
          <div className="overflow-y-auto" style={{ height: '100%' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader={true} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Select</TableCell>
                  <TableCell isHeader={true} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Renewal ID</TableCell>
                  <TableCell isHeader={true} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Vendor Name</TableCell>
                  <TableCell isHeader={true} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Product(s)</TableCell>
                  <TableCell isHeader={true} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Renewal Deadline</TableCell>
                  <TableCell isHeader={true} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Days Until Renewal</TableCell>
                  <TableCell isHeader={true} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</TableCell>
                  <TableCell isHeader={true} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Owner</TableCell>
                  <TableCell isHeader={true} className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Value (USD)</TableCell>
                  <TableCell isHeader={true}className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"> Renewal</TableCell>

                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell isHeader={false} className="px-6 py-8 text-center text-sm text-gray-500" colSpan={9}>
                      Loading...
                      {error && <div className="text-red-600 mt-2">{error}</div>}
                    </TableCell>
                  </TableRow>
                )}

                {!loading && error && (
                  <TableRow>
                    <TableCell isHeader={false} className="px-6 py-8 text-center text-sm text-red-600" colSpan={9}>
                      {error}
                    </TableCell>
                  </TableRow>
                )}

                {!loading && !error && filteredRenewals.length === 0 && (
                  <TableRow>
                    <TableCell isHeader={false} className="px-6 py-8 text-center text-sm text-gray-500" colSpan={9}>
                      No renewals found
                    </TableCell>
                  </TableRow>
                )}

                {!loading && !error && filteredRenewals.map((r) => (
                  <TableRow key={r.id} className="hover:bg-indigo-50/40 transition-colors">
                    <TableCell isHeader={false} className="px-4 py-3 text-sm">
                      <input
                        type="radio"
                        name="selectedContract"
                        checked={selectedContractId === r.id}
                        onChange={() => setSelectedContractId(r.id)}
                        className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                    </TableCell>
                    <TableCell isHeader={false} className="px-4 py-3 text-sm text-indigo-600 font-medium">{r.id}</TableCell>
                    <TableCell isHeader={false} className="px-4 py-3 text-sm text-gray-900 hover:underline cursor-pointer">{r.vendorName}</TableCell>
                    <TableCell isHeader={false} className="px-4 py-3 text-sm text-gray-900">{r.product}</TableCell>
                    <TableCell isHeader={false} className="px-4 py-3 text-sm text-gray-900">{r.renewalDeadline}</TableCell>
                    <TableCell isHeader={false} className={`px-4 py-3 text-sm ${r.daysUntilRenewal !== null && r.daysUntilRenewal <= 30 ? "text-red-600 font-semibold" : "text-gray-900"}`}>
                      {r.daysUntilRenewal !== null ? r.daysUntilRenewal : "N/A"}
                    </TableCell>
                    <TableCell isHeader={false} className="px-4 py-3 text-sm">{renderStageBadge(r.renewalStage)}</TableCell>
                    <TableCell isHeader={false} className="px-4 py-3 text-sm text-gray-900">{r.owner}</TableCell>
                    <TableCell isHeader={false} className="px-4 py-3 text-sm text-gray-900 font-semibold text-right">{r.totalValue}</TableCell>
                    <TableCell isHeader={false} className="px-4 py-3 text-sm text-center">
  {selectedContractId === r.id && (
    <PrimaryButton
      onClick={() => triggerRenewal(r)}
      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 text-xs"
    >
      Renewal
    </PrimaryButton>
  )}
</TableCell>

                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="px-6 py-3 text-xs text-gray-500">
            {loading ? "Loading renewals..." : `Showing ${filteredRenewals.length} of ${rows.length} renewals (only items with daysUntilRenewal ≤ 90 are shown)`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Renewal_vendor;
