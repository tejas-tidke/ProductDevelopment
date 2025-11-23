import React, { useState } from "react";

export default function SpendBreakdownChart() {
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");

  // Mock data for dropdowns
  const users = ["", "Manish", "Harsh", "Prajwal", "Anurag", "Tejas"];
  const departments = ["", "Finance", "Technology", "Sales", "HR", "Management"];

  // Simple logic to change chart based on selection
  const getChartGradient = () => {
    if (selectedUser && selectedDepartment) {
      return "from-emerald-600 to-emerald-400";
    } else if (selectedUser) {
      return "from-emerald-700 to-emerald-300";
    } else if (selectedDepartment) {
      return "from-emerald-600 to-emerald-100";
    } else {
      return "from-emerald-500 to-emerald-200";
    }
  };

  return (
    <div className="h-100  overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90 h-10">
            Spend Breakdown
          </h3>
          <p className="mt-0.5 text-semibold text-gray-900 dark:text-gray-400">
            Breakdown of spend categories
          </p>
        </div>

        <div className="flex items-center gap-2 h-30">
          <label className="text-bold text-gray-900 dark:text-gray-400" htmlFor="user">
            Select User
          </label>
          <select
            id="user"
            className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            aria-label="Select User"
          >
            {users.map((user, index) => (
              <option key={index} value={user}>
                {user || "Select User"}
              </option>
            ))}
          </select>

          <label className="ml-3 text-bold text-gray-900 dark:text-gray-400  " htmlFor="department">
            Select Department
          </label>
          <select
            id="department"
            className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            aria-label="Select Department"
          >
            {departments.map((dept, index) => (
              <option key={index} value={dept}>
                {dept || "Select Department"}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-20 ">
        {/* Placeholder semicircle / pie chart */}
        <div className={`h-20 w-200 rounded-full bg-gradient-to-r ${getChartGradient()}`} />
      </div>
    </div>
  );
}