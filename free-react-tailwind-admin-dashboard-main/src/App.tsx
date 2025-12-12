import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/CreateNewUser";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import UserDataCheck from "./pages/UserDataCheck";
import CreateNewProject from "./layout/CreateNewProject";
import AllProjects from "./pages/AllProjects";
import ProjectDetail from "./pages/ProjectDetail";
import Issues from "./pages/Issues";
import UsersList from "./pages/UsersList";
import EvaluateTool from "./pages/evaluate-tool.tsx";
import ProcurementNew from "./pages/procurement-new.tsx";
import ProcurementRenewal from "./pages/procurement-renewal.tsx";
import Request from "./pages/Request";
import Reports from "./pages/Reports";
import AllOpen from "./pages/request-management/AllOpen.tsx";
import AssignedToMe from "./pages/request-management/AssignedToMe";
import Unassigned from "./pages/request-management/Unassigned";
import Resolved from "./pages/request-management/Resolved";
// import IssueDetail from "./pages/IssueDetail";
// import IssuesSplitView from "./pages/IssueSplitView";
// import DEMO_REQUEST from "./pages/DEMO_REQUEST";
// import ADMIN_Approver from "./pages/ADMIN_Approver";
import VendorList from "./pages/VendorManagement/VendorList";
import VendorAgreementDetails from "./pages/VendorManagement/VendorAgreementDetails.tsx";
import VendorAgreements from "./pages/VendorManagement/VendorAgreements.tsx";
import VendorPerformance from "./pages/VendorManagement/VendorPerformance";
import VendorRenewal from "./pages/VendorManagement/VendorRenewal/Renewal_vendor";
import RequestSplitView from "./pages/RequestSplitView";
import SendInvitation from "./pages/SendInvitation";
import CompleteInvitation from "./pages/CompleteInvitation";
import ProtectedPermissionRoute from "./components/auth/ProtectedPermissionRoute";
import { Permission } from "./config/permissions";
import Organizations from "./pages/Organizations";
// import AttachmentTestPage from "./pages/AttachmentTestPage";
// import SimpleAttachmentTest from "./pages/SimpleAttachmentTest";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Redirect root path to sign-in for unauthenticated users */}
          <Route path="/" element={<Navigate to="/signin" replace />} />
          
          {/* Dashboard Layout - Protected Routes */}
          <Route element={<AppLayout />}>
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              } 
            />

            {/* Others Page */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <UserProfiles />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/calendar" 
              element={
                <ProtectedRoute>
                  <Calendar />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/blank" 
              element={
                <ProtectedRoute>
                  <Blank />
                </ProtectedRoute>
              } 
            />

            {/* Forms */}
            <Route 
              path="/form-elements" 
              element={
                <ProtectedRoute>
                  <FormElements />
                </ProtectedRoute>
              } 
            />

            {/* Tables */}
            <Route 
              path="/basic-tables" 
              element={
                <ProtectedRoute>
                  <BasicTables />
                </ProtectedRoute>
              } 
            />

            {/* Ui Elements */}
            <Route 
              path="/alerts" 
              element={
                <ProtectedRoute>
                  <Alerts />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/avatars" 
              element={
                <ProtectedRoute>
                  <Avatars />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/badge" 
              element={
                <ProtectedRoute>
                  <Badges />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/buttons" 
              element={
                <ProtectedRoute>
                  <Buttons />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/images" 
              element={
                <ProtectedRoute>
                  <Images />
                </ProtectedRoute>
              } 
            />
          

            {/* Charts */}
            <Route 
              path="/line-chart" 
              element={
                <ProtectedRoute>
                  <LineChart />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bar-chart" 
              element={
                <ProtectedRoute>
                  <BarChart />
                </ProtectedRoute>
              } 
            />
            
            {/* User Data Check */}
            <Route 
              path="/user-data-check" 
              element={
                <ProtectedRoute>
                  <UserDataCheck />
                </ProtectedRoute>
              } 
            />
            
            {/* Create New Project */}
            <Route 
              path="/create-new-project" 
              element={
                <ProtectedRoute>
                  <CreateNewProject />
                </ProtectedRoute>
              } 
            />
            
            {/* All Projects */}
            <Route 
              path="/all-projects" 
              element={
                <ProtectedRoute>
                  <AllProjects />
                </ProtectedRoute>
              } 
            />
            
            {/* Individual Project Detail */}
            <Route 
              path="/project/:projectId" 
              element={
                <ProtectedRoute>
                  <ProjectDetail />
                </ProtectedRoute>
              } 
            />
            
            {/* Issues Page */}
            <Route 
              path="/issues" 
              element={
                <ProtectedRoute>
                  <Issues />
                </ProtectedRoute>
              } 
            />
            
            {/* Individual Issue Detail
            <Route 
              path="/issues/:issueKey" 
              element={
                <ProtectedRoute>
                  <IssueDetail />
                </ProtectedRoute>
              } 
            />
            
            {/* Issues Split View */}
            {/* <Route 
              path="/issues-split" 
              element={
                <ProtectedRoute>
                  <IssuesSplitView />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/issues-split/:issueKey" 
              element={
                <ProtectedRoute>
                  <IssuesSplitView />
                </ProtectedRoute>
              } 
            /> */} 
            
            {/* Users List Page */}
            <Route 
              path="/users" 
              element={
                <ProtectedPermissionRoute requiredPermissions={[Permission.VIEW_USERS]}>
                  <UsersList />
                </ProtectedPermissionRoute>
              } 
            />

            <Route 
              path="/create-user" 
              element={
                <ProtectedPermissionRoute requiredPermissions={[Permission.CREATE_USER]}>
                  <Blank />
                </ProtectedPermissionRoute>
              } 
            />

            <Route 
              path="/dashboard" 
              element={
                <ProtectedPermissionRoute requiredPermissions={[Permission.VIEW_DASHBOARD]}>
                  <Home />
                </ProtectedPermissionRoute>
              } 
            />

            <Route 
              path="/reports" 
              element={
                <ProtectedPermissionRoute requiredPermissions={[Permission.VIEW_REPORTS]}>
                  <Reports />
                </ProtectedPermissionRoute>
              } 
            />

            {/* New routes for the additional pages */}
            <Route 
              path="/evaluate-new" 
              element={
                <ProtectedRoute>
                  <EvaluateTool />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/procurement/new" 
              element={
                <ProtectedRoute>
                  <ProcurementNew />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/procurement/renewal" 
              element={
                <ProtectedPermissionRoute requiredPermissions={[Permission.VIEW_PROCUREMENT_RENEWAL]}>
                  <ProcurementRenewal />
                </ProtectedPermissionRoute>
              } 
            />
            
            <Route 
              path="/requests" 
              element={
                <ProtectedRoute>
                  <Request />
                </ProtectedRoute>
              } 
            />

            {/* Request Management Routes - Only for users with VIEW_ISSUES permission */}
            <Route 
              path="/request-management/all-open" 
              element={
                <ProtectedPermissionRoute requiredPermissions={[Permission.VIEW_ISSUES]}>
                  <AllOpen />
                </ProtectedPermissionRoute>
              } 
            />

            <Route 
              path="/request-management/assigned-to-me" 
              element={
                <ProtectedPermissionRoute requiredPermissions={[Permission.VIEW_ISSUES]}>
                  <AssignedToMe />
                </ProtectedPermissionRoute>
              } 
            />

            <Route 
              path="/request-management/unassigned" 
              element={
                <ProtectedPermissionRoute requiredPermissions={[Permission.VIEW_ISSUES]}>
                  <Unassigned />
                </ProtectedPermissionRoute>
              } 
            />

            {/* Attachment Testing Page - For development/testing purposes
            <Route 
              path="/attachment-test" 
              element={
                <ProtectedRoute>
                  <AttachmentTestPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/simple-attachment-test" 
              element={
                <ProtectedRoute>
                  <SimpleAttachmentTest />
                </ProtectedRoute>
              } 
            /> */} 
            <Route
              path="/request-management/resolved"
              element={
                <ProtectedPermissionRoute requiredPermissions={[Permission.VIEW_ISSUES]}>
                  <Resolved />
                </ProtectedPermissionRoute>
              }
            />

            {/* Request Management Detail View */}
            <Route
              path="/request-management/:issueKey"
              element={
                <ProtectedPermissionRoute requiredPermissions={[Permission.VIEW_ISSUES]}>
                  <RequestSplitView />
                </ProtectedPermissionRoute>
              }
            />

            {/* Vendor Management Routes */}
            <Route 
              path="/vendor-management/list" 
              element={
                <ProtectedPermissionRoute requiredPermissions={[Permission.VIEW_VENDORS]}>
                  <VendorList />
                </ProtectedPermissionRoute>
              } 
            />

            <Route 
              path="/vendor-management/contracts" 
              element={
                <ProtectedPermissionRoute requiredPermissions={[Permission.VIEW_CONTRACTS]}>
                  <VendorAgreements />
                </ProtectedPermissionRoute>
              } 
            />
               <Route 
              path="/vendor-management/VendorRenewal/Renewal_vendor" 
              element={
                <ProtectedPermissionRoute requiredPermissions={[Permission.VIEW_CONTRACTS]}>
                  <VendorRenewal />
                </ProtectedPermissionRoute>
              } 
            />

             <Route 
              path="/vendor-management/contract" 
              element={
                <ProtectedPermissionRoute requiredPermissions={[Permission.VIEW_CONTRACTS]}>
                  {/*
                    VendorAgreementDetails requires props:
                      - agreement
                      - onBack

                    Right now we provide a safe fallback using "as any". Replace this with
                    actual data (from route params or location.state) when you wire it up.
                  */}
                  <VendorAgreementDetails
                    agreement={{} as any}
                    onBack={() => window.history.back()}
                  />
                </ProtectedPermissionRoute>
              } 
            />

            <Route 
              path="/vendor-management/performance" 
              element={
                <ProtectedPermissionRoute requiredPermissions={[Permission.VIEW_VENDORS]}>
                  <VendorPerformance />
                </ProtectedPermissionRoute>
              } 
            />

            {/* Invitation Routes - Only for users with SEND_INVITATIONS permission */}
            <Route 
              path="/send-invitation" 
              element={
                <ProtectedPermissionRoute requiredPermissions={[Permission.SEND_INVITATIONS]}>
                  <SendInvitation />
                </ProtectedPermissionRoute>
              } 
            />
            
            {/* Organizations Route - Only for users with MANAGE_ORGANIZATIONS permission */}
            <Route 
              path="/organizations" 
              element={
                <ProtectedPermissionRoute requiredPermissions={[Permission.MANAGE_ORGANIZATIONS]}>
                  <Organizations />
                </ProtectedPermissionRoute>
              } 
            />

          </Route>

          {/* Complete Invitation Page - Outside of AppLayout to hide header/sidebar */}
          <Route 
            path="/complete-invitation" 
            element={
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <CompleteInvitation />
              </div>
            } 
          />

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
