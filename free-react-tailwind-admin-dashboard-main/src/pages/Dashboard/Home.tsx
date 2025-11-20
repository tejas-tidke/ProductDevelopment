import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import SpendBreakdownChart from "../../components/ecommerce/SpendBreakdownChart";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import RecentOrders from "../../components/ecommerce/RecentOrders";
// import DemographicCard from "../../components/ecommerce/DemographicCard";
import PageMeta from "../../components/common/PageMeta";
import WelcomeBanner from "../../components/dashboard/WelcomeBanner";

export default function Home() {
  return (
    <>
      <PageMeta
        title="React.js Ecommerce Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Ecommerce Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <WelcomeBanner />
        </div>
         
         {/*  Top Apps is inside the RecentOrders */}
        {/* Left column (Spend breakdown + Recent Orders) */}
        <div className="col-span-12 xl:col-span-7 space-y-4">
          <SpendBreakdownChart />
          <RecentOrders />
        </div>

        {/*  PIE chart is inside the MonthlySalesChart and Right column (Monthly Sales + Monthly Target) */}
        <div className="col-span-12 xl:col-span-5 space-y-4">
          <MonthlySalesChart />
          <MonthlyTarget />
        </div>

        <div className="col-span-12">
          <StatisticsChart />
        </div>

        <div className="col-span-12">
          <EcommerceMetrics />
        </div>
      </div>
    </>
  );
}