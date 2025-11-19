// DemographicCard.tsx
import React, { useState } from "react";
import { MoreDotIcon } from "../../icons"; // keep your icon
import CountryMap from "./CountryMap"; // existing component you had

type Country = {
  code: string;
  name: string;
  customers: number;
  percent: number;
  flag?: string;
};

const DEFAULT_COUNTRIES: Country[] = [
  { code: "US", name: "USA", customers: 2379, percent: 79, flag: "/images/country/country-01.svg" },
  { code: "FR", name: "France", customers: 589, percent: 23, flag: "/images/country/country-02.svg" },
  { code: "IN", name: "India", customers: 412, percent: 14, flag: "/images/country/country-03.svg" },
];

function downloadCSV(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function DemographicCard({ countries = DEFAULT_COUNTRIES }: { countries?: Country[] }) {
  const [open, setOpen] = useState(false);

  function exportCSV() {
    const rows = [["Code", "Country", "Customers", "Percent"]];
    countries.forEach((c) => rows.push([c.code, c.name, String(c.customers), `${c.percent}%`]));
    downloadCSV("customers_by_country.csv", rows);
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Customers Demographic</h3>
          <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">Number of customers based on country</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            aria-label="Export countries to CSV"
            title="Export CSV"
          >
            Export CSV
          </button>

          <button
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="true"
            aria-expanded={open}
            aria-label="More options"
            className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-white/5"
            title="More"
          >
            <MoreDotIcon className="text-gray-400 size-6" />
          </button>
        </div>
      </div>

      <div className="mt-5 border border-gray-100 rounded-2xl overflow-hidden dark:border-gray-800">
        {/* Map area: your CountryMap should accept props for highlighting if needed */}
        <div className="w-full h-[212px] sm:h-[240px] md:h-[260px]">
          <CountryMap countries={countries} />
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {countries.map((c) => (
          <div key={c.code} className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                {c.flag ? <img src={c.flag} alt={`${c.name} flag`} className="w-full h-full object-cover" /> : <span className="text-xs">{c.code}</span>}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 text-sm dark:text-white/90 truncate">{c.name}</p>
                <span className="text-gray-500 text-xs dark:text-gray-400">{c.customers.toLocaleString()} Customers</span>
              </div>
            </div>

            <div className="flex items-center gap-3 min-w-[120px] justify-end">
              <div className="relative w-[100px] h-2 bg-gray-200 rounded-sm dark:bg-gray-800">
                <div className="absolute left-0 top-0 h-full rounded-sm bg-emerald-500" style={{ width: `${Math.max(0, Math.min(100, c.percent))}%` }} />
              </div>
              <div className="text-sm font-medium text-gray-800 dark:text-white/90">{c.percent}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}