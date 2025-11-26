// src/components/MonthlySalesChart.tsx
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { MoreDotIcon } from "../../icons";
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * MonthlySalesChart - final version
 * - Tooltip appears on hover and hides immediately on leave
 * - Injects tooltip CSS to avoid stray/empty boxes
 */

type ViewMode = "Burndown" | "Velocity" | "Cumulative Flow" | "Issue Types";

type Sprint = {
  id: string;
  name: string;
  start: string;
  end: string;
  burndown: { date: string; remaining: number; ideal?: number }[];
  committed: number;
  completed: number;
  cumulativeFlow: {
    date: string;
    todo: number;
    inProgress: number;
    review: number;
    done: number;
  }[];
  issueTypes: { name: string; count: number }[];
};

const sprints: Sprint[] = [
  {
    id: "S14",
    name: "Sprint 14",
    start: "2025-10-13",
    end: "2025-10-24",
    burndown: [
      { date: "2025-10-13", remaining: 46, ideal: 46 },
      { date: "2025-10-14", remaining: 42, ideal: 42 },
      { date: "2025-10-15", remaining: 41, ideal: 38 },
      { date: "2025-10-16", remaining: 35, ideal: 34 },
      { date: "2025-10-17", remaining: 30, ideal: 30 },
      { date: "2025-10-20", remaining: 22, ideal: 23 },
      { date: "2025-10-21", remaining: 16, ideal: 19 },
      { date: "2025-10-22", remaining: 10, ideal: 15 },
      { date: "2025-10-23", remaining: 6, ideal: 11 },
      { date: "2025-10-24", remaining: 0, ideal: 7 },
    ],
    committed: 46,
    completed: 47,
    cumulativeFlow: [
      { date: "2025-10-13", todo: 21, inProgress: 8, review: 2, done: 0 },
      { date: "2025-10-14", todo: 20, inProgress: 9, review: 3, done: 1 },
      { date: "2025-10-15", todo: 18, inProgress: 10, review: 3, done: 3 },
      { date: "2025-10-16", todo: 15, inProgress: 10, review: 4, done: 5 },
      { date: "2025-10-17", todo: 13, inProgress: 9, review: 5, done: 7 },
      { date: "2025-10-20", todo: 10, inProgress: 8, review: 5, done: 10 },
      { date: "2025-10-21", todo: 8, inProgress: 7, review: 5, done: 12 },
      { date: "2025-10-22", todo: 6, inProgress: 6, review: 5, done: 14 },
      { date: "2025-10-23", todo: 4, inProgress: 5, review: 4, done: 17 },
      { date: "2025-10-24", todo: 0, inProgress: 0, review: 0, done: 21 },
    ],
    issueTypes: [
      { name: "Story", count: 14 },
      { name: "Task", count: 9 },
      { name: "Bug", count: 6 },
      { name: "Spike", count: 2 },
    ],
  },
  {
    id: "S15",
    name: "Sprint 15",
    start: "2025-10-27",
    end: "2025-11-07",
    burndown: [
      { date: "2025-10-27", remaining: 52, ideal: 52 },
      { date: "2025-10-28", remaining: 49, ideal: 47 },
      { date: "2025-10-29", remaining: 47, ideal: 43 },
      { date: "2025-10-30", remaining: 44, ideal: 38 },
      { date: "2025-10-31", remaining: 39, ideal: 34 },
      { date: "2025-11-03", remaining: 33, ideal: 29 },
      { date: "2025-11-04", remaining: 26, ideal: 25 },
      { date: "2025-11-05", remaining: 18, ideal: 20 },
      { date: "2025-11-06", remaining: 9, ideal: 16 },
      { date: "2025-11-07", remaining: 3, ideal: 11 },
    ],
    committed: 52,
    completed: 49,
    cumulativeFlow: [
      { date: "2025-10-27", todo: 24, inProgress: 8, review: 2, done: 0 },
      { date: "2025-10-28", todo: 23, inProgress: 9, review: 2, done: 1 },
      { date: "2025-10-29", todo: 21, inProgress: 10, review: 3, done: 2 },
      { date: "2025-10-30", todo: 19, inProgress: 11, review: 3, done: 3 },
      { date: "2025-10-31", todo: 17, inProgress: 11, review: 4, done: 5 },
      { date: "2025-11-03", todo: 14, inProgress: 10, review: 5, done: 8 },
      { date: "2025-11-04", todo: 12, inProgress: 9, review: 5, done: 10 },
      { date: "2025-11-05", todo: 9, inProgress: 8, review: 5, done: 12 },
      { date: "2025-11-06", todo: 6, inProgress: 7, review: 4, done: 15 },
      { date: "2025-11-07", todo: 2, inProgress: 3, review: 3, done: 19 },
    ],
    issueTypes: [
      { name: "Story", count: 12 },
      { name: "Task", count: 11 },
      { name: "Bug", count: 8 },
      { name: "Spike", count: 3 },
    ],
  },
  {
    id: "S16",
    name: "Sprint 16 (Planned)",
    start: "2025-11-10",
    end: "2025-11-21",
    burndown: [
      { date: "2025-11-10", remaining: 50, ideal: 50 },
      { date: "2025-11-11", remaining: 48, ideal: 45 },
      { date: "2025-11-12", remaining: 46, ideal: 41 },
      { date: "2025-11-13", remaining: 44, ideal: 36 },
      { date: "2025-11-14", remaining: 41, ideal: 32 },
      { date: "2025-11-17", remaining: 35, ideal: 27 },
      { date: "2025-11-18", remaining: 30, ideal: 23 },
      { date: "2025-11-19", remaining: 24, ideal: 18 },
      { date: "2025-11-20", remaining: 15, ideal: 14 },
      { date: "2025-11-21", remaining: 7, ideal: 9 },
    ],
    committed: 50,
    completed: 0,
    cumulativeFlow: [
      { date: "2025-11-10", todo: 22, inProgress: 7, review: 1, done: 0 },
      { date: "2025-11-11", todo: 21, inProgress: 8, review: 1, done: 0 },
      { date: "2025-11-12", todo: 20, inProgress: 9, review: 2, done: 0 },
      { date: "2025-11-13", todo: 19, inProgress: 9, review: 3, done: 0 },
      { date: "2025-11-14", todo: 18, inProgress: 9, review: 4, done: 0 },
      { date: "2025-11-17", todo: 16, inProgress: 10, review: 4, done: 1 },
      { date: "2025-11-18", todo: 15, inProgress: 10, review: 5, done: 1 },
      { date: "2025-11-19", todo: 14, inProgress: 10, review: 5, done: 2 },
      { date: "2025-11-20", todo: 12, inProgress: 9, review: 6, done: 3 },
      { date: "2025-11-21", todo: 10, inProgress: 8, review: 6, done: 5 },
    ],
    issueTypes: [
      { name: "Story", count: 10 },
      { name: "Task", count: 8 },
      { name: "Bug", count: 6 },
      { name: "Spike", count: 2 },
    ],
  },
];

const brandYellow = "#ffed46ff";
const brandBlue = "#3b82f6";
const brandGreen = "#22c55e";
const brandOrange = "#f59e0b";
const brandPurple = "#a855f7";
const gridBorder = "rgba(107,114,128,0.2)";

/* small in-file dropdown (no portal) */
interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement>;
  className?: string;
  children?: React.ReactNode;
}
function Dropdown({ isOpen, onClose, anchorRef, className = "", children }: DropdownProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleDocClick(e: MouseEvent) {
      const t = e.target as Node;
      const clickedInsideAnchor = !!anchorRef?.current && anchorRef.current.contains(t as Node);
      const clickedInsideMenu = !!menuRef.current && menuRef.current.contains(t as Node);
      if (!clickedInsideAnchor && !clickedInsideMenu) onClose();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleDocClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleDocClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-hidden={!isOpen}
      className={`absolute right-0 top-full mt-2 z-50 w-44 rounded-lg border bg-white shadow-md p-2 dark:border-gray-800 dark:bg-gray-800 ${className}`}
    >
      {children}
    </div>
  );
}
function DropdownItem({ onItemClick, className = "", children }: { onItemClick?: () => void; className?: string; children?: React.ReactNode }) {
  return (
    <button type="button" onClick={onItemClick} className={`w-full rounded-lg px-2 py-2 text-left text-sm transition ${className}`}>
      {children}
    </button>
  );
}

export default function MonthlySalesChart() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<ViewMode>("Issue Types");
  const [sprintId, setSprintId] = useState<string>(sprints[1].id);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const sprint = useMemo(() => sprints.find((s) => s.id === sprintId) ?? sprints[0], [sprintId]);

  // Inject tooltip CSS once so stray boxes won't appear and styling is professional
  useEffect(() => {
    const id = "apex-tooltip-style-monthly-sales";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `
      .apexcharts-tooltip { display: none; pointer-events: none; opacity: 0; transition: opacity 120ms ease, transform 120ms ease; background: #fff; color: #0f172a; border-radius: 10px; padding: 8px 10px; box-shadow: 0 6px 18px rgba(15,23,42,0.06); border: 1px solid rgba(15,23,42,0.06); z-index: 9999; font-family: Outfit, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; font-size: 13px; }
      .apexcharts-tooltip * { color: inherit; }
      .dark .apexcharts-tooltip { background: rgba(15,23,42,0.92); color: #e6edf3; border: 1px solid rgba(255,255,255,0.04); box-shadow: 0 6px 24px rgba(2,6,23,0.6); }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  // Base tooltip settings
  const baseTooltip: ApexOptions["tooltip"] = {
    theme: "light",
    style: { fontSize: "13px", fontFamily: "Outfit, sans-serif" },
    followCursor: false,
    fillSeriesColor: false,
  } as any;

  // Fixed chart id
  const CHART_ID = "monthly-sales-chart";

  // show/hide handlers using ApexCharts.exec with DOM fallback
  const mouseEnterHandler = () => {
    try {
      (window as any).ApexCharts?.exec?.(CHART_ID, "showTooltip");
    } catch {
      const el = document.querySelector(".apexcharts-tooltip") as HTMLElement | null;
      if (el) {
        el.style.display = "block";
        el.style.opacity = "1";
        el.style.pointerEvents = "none";
      }
    }
  };
  const mouseLeaveHandler = () => {
    try {
      (window as any).ApexCharts?.exec?.(CHART_ID, "hideTooltip");
    } catch {
      const el = document.querySelector(".apexcharts-tooltip") as HTMLElement | null;
      if (el) {
        el.style.opacity = "0";
        setTimeout(() => {
          if (el) el.style.display = "none";
        }, 120);
      }
    }
  };

  const chartData = useMemo(() => {
    switch (view) {
      case "Burndown": {
        const categories = sprint.burndown.map((d) => d.date);
        const remaining = sprint.burndown.map((d) => d.remaining);
        const ideal = sprint.burndown.map((d) => d.ideal ?? null);
        const options: ApexOptions = {
          chart: { id: CHART_ID, type: "line", height: 260, toolbar: { show: false }, events: { mouseEnter: mouseEnterHandler, mouseLeave: mouseLeaveHandler } },
          colors: [brandBlue, brandGreen],
          stroke: { width: [3, 2], curve: "straight" },
          markers: { size: [4, 0] },
          xaxis: { categories, labels: { formatter: (val) => formatShortDate(val as string) }, axisTicks: { show: false }, axisBorder: { show: false } },
          yaxis: { title: { text: "Story Points" }, min: 0, forceNiceScale: true },
          legend: { show: true, position: "top", horizontalAlign: "left", fontFamily: "Outfit" },
          grid: { borderColor: gridBorder, yaxis: { lines: { show: true } } },
          tooltip: { ...(baseTooltip as any), x: { formatter: (val) => formatLongDate(val as string) }, y: { formatter: (v) => `${v} pts` } },
        };
        const series = [{ name: "Remaining", data: remaining }, { name: "Ideal", data: ideal }];
        return { options, series, type: "line" as const, height: 260 };
      }

      case "Velocity": {
        const categories = sprints.map((s) => s.name);
        const committed = sprints.map((s) => s.committed);
        const completed = sprints.map((s) => s.completed);
        const options: ApexOptions = {
          chart: { id: CHART_ID, type: "bar", height: 260, toolbar: { show: false }, events: { mouseEnter: mouseEnterHandler, mouseLeave: mouseLeaveHandler } },
          colors: [brandOrange, brandGreen],
          plotOptions: { bar: { horizontal: false, columnWidth: "40%", borderRadius: 6, borderRadiusApplication: "end" } },
          dataLabels: { enabled: false },
          xaxis: { categories, axisTicks: { show: false }, axisBorder: { show: false } },
          yaxis: { title: { text: "Story Points" }, min: 0, forceNiceScale: true },
          legend: { show: true, position: "top", horizontalAlign: "left", fontFamily: "Outfit" },
          grid: { borderColor: gridBorder, yaxis: { lines: { show: true } } },
          tooltip: { ...(baseTooltip as any), y: { formatter: (v) => `${v} pts` } },
        };
        const series = [{ name: "Committed", data: committed }, { name: "Completed", data: completed }];
        return { options, series, type: "bar" as const, height: 260 };
      }

      case "Cumulative Flow": {
        const categories = sprint.cumulativeFlow.map((d) => d.date);
        const todo = sprint.cumulativeFlow.map((d) => d.todo);
        const inProgress = sprint.cumulativeFlow.map((d) => d.inProgress);
        const review = sprint.cumulativeFlow.map((d) => d.review);
        const done = sprint.cumulativeFlow.map((d) => d.done);
        const options: ApexOptions = {
          chart: { id: CHART_ID, type: "area", height: 260, stacked: true, toolbar: { show: false }, events: { mouseEnter: mouseEnterHandler, mouseLeave: mouseLeaveHandler } },
          colors: [brandYellow, brandBlue, brandPurple, brandGreen],
          stroke: { curve: "smooth", width: 2 },
          dataLabels: { enabled: false },
          xaxis: { categories, labels: { formatter: (v) => formatShortDate(v as string) }, axisTicks: { show: false }, axisBorder: { show: false } },
          yaxis: { title: { text: "Issues" }, min: 0, forceNiceScale: true },
          legend: { show: true, position: "top", horizontalAlign: "left", fontFamily: "Outfit" },
          grid: { borderColor: gridBorder, yaxis: { lines: { show: true } } },
          tooltip: { ...(baseTooltip as any), shared: true, x: { formatter: (val) => formatLongDate(val as string) }, y: { formatter: (v) => `${v} issues` } },
          fill: { opacity: 0.6 },
        };
        const series = [{ name: "To Do", data: todo }, { name: "In Progress", data: inProgress }, { name: "Review", data: review }, { name: "Done", data: done }];
        return { options, series, type: "area" as const, height: 260 };
      }

      case "Issue Types": {
        const labels = sprint.issueTypes.map((i) => i.name);
        const counts = sprint.issueTypes.map((i) => i.count);
        const options: ApexOptions = {
          chart: { id: CHART_ID, type: "donut", height: 260, toolbar: { show: false }, events: { mouseEnter: mouseEnterHandler, mouseLeave: mouseLeaveHandler } },
          labels,
          colors: [brandBlue, brandGreen, brandOrange, brandPurple, brandYellow],
          legend: { show: true, position: "right", fontFamily: "Outfit" },
          dataLabels: { enabled: true },
          tooltip: {
            ...(baseTooltip as any),
            y: {
              formatter: (v) => {
                const total = counts.reduce((a, b) => a + b, 0);
                const pct = total ? ((v as number) / total) * 100 : 0;
                return `${v} issues (${pct.toFixed(1)}%)`;
              },
            },
          },
          plotOptions: {
            pie: {
              donut: {
                size: "60%",
                labels: {
                  show: true,
                  total: { show: true, label: "Total", formatter: () => `${counts.reduce((a, b) => a + b, 0)}` },
                },
              },
            },
          },
        };
        const series = counts;
        return { options, series, type: "donut" as const, height: 260 };
      }

      default:
        return { options: {}, series: [], type: "donut" as const, height: 260 };
    }
  }, [view, sprint]);

  function toggleDropdown() {
    setIsOpen((p) => !p);
  }
  function closeDropdown() {
    setIsOpen(false);
  }

  function onExportCSV() {
    const rows: string[] = [];
    if (view === "Burndown") {
      rows.push("Date,Remaining,Ideal");
      sprint.burndown.forEach((d) => rows.push(`${d.date},${d.remaining},${d.ideal ?? ""}`));
    } else if (view === "Velocity") {
      rows.push("Sprint,Committed,Completed");
      sprints.forEach((s) => rows.push(`${s.name},${s.committed},${s.completed}`));
    } else if (view === "Cumulative Flow") {
      rows.push("Date,To Do,In Progress,Review,Done");
      sprint.cumulativeFlow.forEach((d) => rows.push(`${d.date},${d.todo},${d.inProgress},${d.review},${d.done}`));
    } else if (view === "Issue Types") {
      rows.push("Issue Type,Count");
      sprint.issueTypes.forEach((i) => rows.push(`${i.name},${i.count}`));
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeView = view.replace(/\s+/g, "-").toLowerCase();
    a.download = `${sprint.name}-${safeView}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="overflow-visible rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      {/* Header for Pie Chart and Monthly Sales Chart */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90 h-10">PIE CHART</h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Sprint Analytics like Jira: Issue Types</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExportCSV}
            className="hidden sm:inline-flex items-center rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.99] dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5"
            aria-label="Export current view as CSV"
          >
            Export CSV
          </button>

          <div ref={containerRef} className="relative inline-block">
            <button className="dropdown-toggle" onClick={toggleDropdown} aria-label="More options">
              <MoreDotIcon className="size-6 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
            </button>

            <Dropdown isOpen={isOpen} onClose={closeDropdown} anchorRef={containerRef} className="w-44 p-2">
              {/* <DropdownItem
                onItemClick={() => {
                  onExportCSV();
                  closeDropdown();
                }}
                className="flex w-full rounded-lg text-left font-normal text-gray-600 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-gray-100"
              >
                Export CSV
              </DropdownItem> */}
              <DropdownItem
                onItemClick={closeDropdown}
                className="flex w-full rounded-lg text-left font-normal text-gray-600 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-gray-100"
              >
                View More
              </DropdownItem>
              <DropdownItem
                onItemClick={closeDropdown}
                className="flex w-full rounded-lg text-left font-normal text-gray-600 hover:bg-gray-100 hover:bg-text-200 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-gray-100"
              >
                Delete
              </DropdownItem>
            </Dropdown>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-gray-500 dark:text-gray-400" htmlFor="sprint">
            Sprint
          </label>
          <select
            id="sprint"
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition dark:border-gray-700 dark:bg-transparent dark:text-gray-200"
            value={sprintId}
            onChange={(e) => setSprintId(e.target.value)}
            aria-label="Select sprint"
          >
            {sprints.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <label className="ml-3 text-xs text-gray-500 dark:text-gray-400" htmlFor="view">
            View
          </label>
          <select
            id="view"
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition dark:border-gray-700 dark:bg-transparent dark:text-gray-200"
            value={view}
            onChange={(e) => setView(e.target.value as ViewMode)}
            aria-label="Select view"
          >
            <option>Issue Types</option>
            {/* <option>Burndown</option>
            <option>Velocity</option>
            <option>Cumulative Flow</option> */}
          </select>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400">{formatRange(sprint.start, sprint.end)}</div>
      </div>

      {/* Chart */}
      <div className="mt-4 max-w-full overflow-visible custom-scrollbar">
        <div className="-ml-5 min-w-[720px] pl-2 xl:min-w-full">
          <Chart options={chartData.options as ApexOptions} series={chartData.series as any} type={chartData.type} height={chartData.height} />
        </div>
      </div>
    </div>
  );
}

/* helpers */
function formatShortDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function formatLongDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
function formatRange(startIso: string, endIso: string) {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  const sStr = s.toLocaleDateString(undefined, { month: "short", day: "numeric", year: s.getFullYear() !== e.getFullYear() ? "numeric" : undefined });
  const eStr = e.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return sameMonth ? `${sStr} – ${eStr}, ${e.getFullYear()}` : `${sStr} – ${eStr}`;
}