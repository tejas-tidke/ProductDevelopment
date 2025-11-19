// StatisticsChart.tsx
import React, { useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

type KPI = {
  label: string;
  value: string;
  sub?: string;
};

const KPIS: KPI[] = [
  { label: "Awarded To Spend (Actual)", value: "8,240,508 USD" },
  { label: "Awarded To Spend (Contracted)", value: "6,500,000 USD" },
  { label: "Awarded to Spend (Annualised)", value: "6,563,758 USD" },
  { label: "Savings Delivered", value: "709,665 USD" },
  { label: "Savings Guaranteed", value: "670,000 USD" },
];

function exportChartPNG() {
  const svg = document.querySelector(".apexcharts-canvas svg") as SVGElement | null;
  if (!svg) {
    alert("Chart SVG not found");
    return;
  }
  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(svg);
  const img = new Image();
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgStr);
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(800, svg.clientWidth);
    canvas.height = Math.max(400, svg.clientHeight);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "statistics_chart.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
}

export default function StatisticsChart() {
  const [chartType, setChartType] = useState<"area" | "line">("area");
  const [contractYear, setContractYear] = useState("Nov 2023 - Nov 2024");

  const categories = useMemo(() => ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], []);
  const series = useMemo(() => [
    { name: "Sales", data: [180,190,170,160,175,165,170,205,230,210,240,235] },
    { name: "Revenue", data: [40,30,50,40,55,40,70,100,110,120,150,140] },
  ], []);

  const options: ApexOptions = {
    chart: { toolbar: { show: false }, type: chartType, height: 320 },
    colors: ["#2F9E44", "#8CC5FF"],
    stroke: { curve: "straight", width: [2,2] },
    fill: { type: "gradient", gradient: { opacityFrom: 0.55, opacityTo: 0 } },
    markers: { size: 0, hover: { size: 6 } },
    legend: { show: false },
    xaxis: { categories, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: ["#6B7280"], fontSize: "12px" } } },
    grid: { xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
    tooltip: { enabled: true },
  };

  // Mocked small widgets data
  const fulfillment = { procured: 6830408, pipelined: 1410100 }; // as in screenshot numbers
  const guaranteed = { target: 670000, delivered: 709665 };

  return (
    <div>
      {/* KPI tiles row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {KPIS.map((k) => (
          <div key={k.label} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="text-xs text-gray-500">{k.label}</div>
            <div className="mt-3 text-lg font-semibold text-gray-800 dark:text-white/90">{k.value}</div>
            {k.sub ? <div className="text-xs text-gray-400 mt-1">{k.sub}</div> : null}
          </div>
        ))}
      </div>

      {/* Main content - left large chart, right small widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left (chart) - takes 2/3 on large screens */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Statistics</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Target you’ve set for each month</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={contractYear}
                onChange={(e) => setContractYear(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                aria-label="Contract Year"
              >
                <option>Nov 2023 - Nov 2024</option>
                <option>Jan 2024 - Jan 2025</option>
              </select>

              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as any)}
                className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                aria-label="Chart Type"
              >
                <option value="area">Area</option>
                <option value="line">Line</option>
              </select>

              <button
                onClick={exportChartPNG}
                className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                Export PNG
              </button>
            </div>
          </div>

          <div className="max-w-full overflow-x-auto">
            <div className="min-w-[700px]">
              <Chart options={options} series={series} type={chartType} height={320} />
            </div>
          </div>
        </div>

        {/* Right column with small widgets (Fulfillment / Guaranteed vs Savings / Spend breakdown placeholder) */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">Fulfillment Tracker</h4>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="w-full h-36">
                  {/* Simple SVG pie-like visualization (static) */}
                  <svg viewBox="0 0 36 36" className="w-full h-full">
                    <circle cx="18" cy="18" r="15.9155" fill="#E6F4EA" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.9155"
                      fill="transparent"
                      stroke="#2F9E44"
                      strokeWidth="31.831"
                      strokeDasharray={`${(fulfillment.procured / (fulfillment.procured + fulfillment.pipelined)) * 100} ${100}`}
                      transform="rotate(-90 18 18)"
                    />
                  </svg>
                </div>
              </div>

              <div className="flex-1">
                <div className="text-sm text-gray-500">Spendflo Procured</div>
                <div className="text-base font-semibold text-gray-800">{fulfillment.procured.toLocaleString()} USD</div>

                <div className="mt-3 text-sm text-gray-500">Spendflo Pipelined</div>
                <div className="text-base font-semibold text-gray-800">{fulfillment.pipelined.toLocaleString()} USD</div>
              </div>
            </div>

            <div className="mt-3">
              <button className="text-sm text-emerald-600">View Report</button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">Guaranteed Vs Savings</h4>
            <div className="mt-4">
              <div className="w-full h-6 bg-gray-200 rounded-full relative">
                <div className="absolute left-0 top-0 h-full rounded-full bg-emerald-500"
                     style={{ width: `${Math.min(100, (guaranteed.delivered / guaranteed.target) * 100)}%` }} />
              </div>
              <div className="flex justify-between text-xs mt-2 text-gray-500">
                <div>0</div>
                <div>{guaranteed.target.toLocaleString()} USD</div>
              </div>
              <div className="mt-2 text-xs text-gray-400">We've hit your savings guarantee—now watch us go beyond it. Bigger wins ahead: { (guaranteed.delivered - guaranteed.target).toLocaleString() }</div>
              <div className="mt-3">
                <button className="text-sm text-emerald-600">View Report</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}