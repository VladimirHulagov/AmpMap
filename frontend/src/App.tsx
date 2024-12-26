import dayjs from "dayjs"
import isToday from "dayjs/plugin/isToday"
import updateLocale from "dayjs/plugin/updateLocale"
import { useNotificationWS } from "entities/notifications/model/use-notification-ws"
import "react-image-crop/dist/ReactCrop.css"
import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom"
import { Navigate } from "react-router-dom"
import { Main } from "widgets"

import { ProjectDetailsAccessManagementPage } from "pages/administration/projects/project-details/access-management"
import { ProjectDetailsSettingsPage } from "pages/administration/projects/project-details/settings"
import { ProjectDetailsStatusesPage } from "pages/administration/projects/project-details/statuses"
import { ErrorPage } from "pages/error-page/error-page"
import { LoginPage } from "pages/login"
import {
  NotificationListPage,
  NotificationSettingsPage,
  NotificationsPage,
} from "pages/notifications"
import {
  ProjectLayout,
  ProjectMainPage,
  TestPlanActivityPage,
  TestPlansPage,
  TestSuitesPage,
} from "pages/project"

import { getLang } from "shared/libs"
import "shared/styles/global.css"

import { RequireAuth } from "./entities/auth/ui/require-auth"
import { CreateTestCaseView } from "./features/test-case/create-test-case/create-test-case-view"
import { EditTestCaseView } from "./features/test-case/edit-test-case/edit-test-case-view"
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
import { ProjectOverviewPage } from "./pages/project/overview/overview"

dayjs.extend(isToday)
dayjs.extend(updateLocale)
dayjs.updateLocale(getLang(), {
  weekStart: 1,
})

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      {/* protected routes */}
      <Route element={<RequireAuth />}>
        <Route path="/" element={<Main />}>
          <Route index element={<DashboardPage />} />
          <Route path="administration/projects" element={<ProjectsMain />} />
          <Route path="administration/users" element={<UsersPage />} />

          <Route element={<ProjectLayout />}>
            {/* projects routes */}
            <Route path="projects/:projectId">
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<ProjectOverviewPage />} />

              <Route element={<ProjectMainPage />}>
                <Route path="suites">
                  <Route index element={<TestSuitesPage />} />
                  <Route path=":testSuiteId" element={<TestSuitesPage />} />
                  <Route path=":testSuiteId/new-test-case" element={<CreateTestCaseView />} />
                  <Route path=":testSuiteId/edit-test-case" element={<EditTestCaseView />} />
                </Route>
                <Route path="plans">
                  <Route index element={<TestPlansPage />} />
                  <Route path=":testPlanId" element={<TestPlansPage />} />
                  <Route path=":testPlanId/activity" element={<TestPlanActivityPage />} />
                </Route>
              </Route>
            </Route>

            {/* administrations routes */}
            <Route path="administration">
              <Route path="projects" element={<ProjectsMain />} />
              <Route path="projects/:projectId" element={<ProjectDetailsMainPage />}>
                <Route path="overview" element={<ProjectDetailsOverviewPage />} />
                <Route path="parameters" element={<ProjectDetailsParametersPage />} />
                <Route path="labels" element={<ProjectDetailsLabelsPage />} />
                <Route path="statuses" element={<ProjectDetailsStatusesPage />} />
                <Route path="access-management" element={<ProjectDetailsAccessManagementPage />} />
                <Route path="attributes" element={<ProjectDetailsCustomAttributesPage />} />
                <Route path="settings" element={<ProjectDetailsSettingsPage />} />
              </Route>
              <Route path="users" element={<UsersPage />} />
            </Route>
          </Route>
          <Route path="profile" element={<ProfilePage />} />
          <Route path="notifications" element={<NotificationsPage />}>
            <Route index element={<NotificationListPage />} />
            <Route path="settings" element={<NotificationSettingsPage />} />
          </Route>
        </Route>
      </Route>

      {/* public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/logout" element={<LogoutPage />} />
      <Route
        path="*"
        element={<ErrorPage code="404" message="Sorry, the page you visited does not exist." />}
      />
    </Route>
  )
)

const App = () => {
  useNotificationWS()
  return <RouterProvider router={router} />
}

export default App
