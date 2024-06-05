import "react-image-crop/dist/ReactCrop.css"
import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom"
import { Main, TestPlansView, TestSuitesView } from "widgets"

import { ProjectDetailsAccessManagementPage } from "pages/administration/projects/project-details/access-management"
import { ProjectDetailsSettingsPage } from "pages/administration/projects/project-details/settings"
import { LoginPage } from "pages/login"
import { ProjectMainPage } from "pages/project/project-main-page"
import { TestPlanActivityPage } from "pages/project/test-plan-activity"

import "shared/styles/global.css"

import { RequireAuth } from "./entities/auth/ui/require-auth"
import { CreateTestCaseView } from "./features/test-case/create-test-case/create-test-case-view"
import { EditTestCaseView } from "./features/test-case/edit-test-case/edit-test-case-view"
import { Page404 } from "./pages/404"
import { ProjectsMain } from "./pages/administration/projects"
import { ProjectDetailsCustomAttributesPage } from "./pages/administration/projects/project-details/custom-attributes"
import { ProjectDetailsLabelsPage } from "./pages/administration/projects/project-details/labels"
import { ProjectDetailsOverviewPage } from "./pages/administration/projects/project-details/overview"
import { ProjectDetailsParametersPage } from "./pages/administration/projects/project-details/parameters"
import { ProjectDetailsMainPage } from "./pages/administration/projects/project-details/project-details-main"
import { UsersPage } from "./pages/administration/users"
import { DashboardPage } from "./pages/dashboard"
import { LogoutPage } from "./pages/logout/logout"
import { ProfilePage } from "./pages/profile/profile-page"
import { ProjectOverviewTab } from "./pages/project/overview"
import { ProjectTestPlans } from "./pages/project/test-plans"
import { ProjectTestSuitesPage } from "./pages/project/test-suites"

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      {/* protected routes */}
      <Route element={<RequireAuth />}>
        <Route path="/" element={<Main />}>
          <Route index element={<DashboardPage />} />

          {/* projects routes */}
          <Route path="projects/:projectId" element={<ProjectMainPage />}>
            <Route index element={<ProjectOverviewTab />} />
            <Route path="suites" element={<ProjectTestSuitesPage />}>
              <Route index element={<TestSuitesView />} />
              <Route path=":testSuiteId" element={<TestSuitesView />} />
              <Route path=":testSuiteId/new-test-case" element={<CreateTestCaseView />} />
              <Route path=":testSuiteId/edit-test-case" element={<EditTestCaseView />} />
            </Route>
            <Route path="plans" element={<ProjectTestPlans />}>
              <Route index element={<TestPlansView />} />
              <Route path=":testPlanId" element={<TestPlansView />} />
              <Route path=":testPlanId/activity" element={<TestPlanActivityPage />} />
            </Route>
          </Route>

          {/* administrations routes */}
          <Route path="administration">
            <Route path="projects" element={<ProjectsMain />} />
            <Route path="projects/:projectId" element={<ProjectDetailsMainPage />}>
              <Route path="overview" element={<ProjectDetailsOverviewPage />} />
              <Route path="parameters" element={<ProjectDetailsParametersPage />} />
              <Route path="labels" element={<ProjectDetailsLabelsPage />} />
              <Route path="access-management" element={<ProjectDetailsAccessManagementPage />} />
              <Route path="attributes" element={<ProjectDetailsCustomAttributesPage />} />
              <Route path="settings" element={<ProjectDetailsSettingsPage />} />
            </Route>
            <Route path="users" element={<UsersPage />} />
          </Route>

          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/logout" element={<LogoutPage />} />
      <Route path="/404" element={<Page404 />} />
      <Route path="*" element={<Page404 />} />
    </Route>
  )
)

const App = () => {
  return <RouterProvider router={router} />
}

export default App
