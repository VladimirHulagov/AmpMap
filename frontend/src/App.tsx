import dayjs from "dayjs"
import isToday from "dayjs/plugin/isToday"
import updateLocale from "dayjs/plugin/updateLocale"
import { useNotificationWS } from "entities/notifications/model/use-notification-ws"
import "react-image-crop/dist/ReactCrop.css"
import {
  Navigate,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  useParams,
} from "react-router-dom"
import { Main } from "widgets"

import { ProjectTab } from "entities/project/model/enum"

import { ChangeTestSuiteView } from "features/suite"
import { CreateTestCaseView } from "features/test-case/create-test-case/create-test-case-view"
import { EditTestCaseView } from "features/test-case/edit-test-case/edit-test-case-view"
import { ChangeTestPlanView } from "features/test-plan"

import { AdministrationUsersPage } from "pages/administration/users/users"
import { ErrorPage } from "pages/error-page/error-page"
import { LoginPage } from "pages/login"
import {
  NotificationListPage,
  NotificationSettingsPage,
  NotificationsPage,
} from "pages/notifications"
import {
  ProjectAccessManagementTabPage,
  ProjectCustomAttributesTabPage,
  ProjectLabelsTabPage,
  ProjectMainPage,
  ProjectOverviewTabPage,
  ProjectParametersTabPage,
  ProjectProvider,
  ProjectSettingsTabPage,
  ProjectStatusesTabPage,
  TestPlanActivityTab,
  TestPlanLayout,
  TestPlansAttachmentsTab,
  TestPlansCustomAttributesTab,
  TestPlansOverviewTab,
  TestSuiteLayout,
  TestSuitesAttachmentsTab,
  TestSuitesCustomAttributesTab,
  TestSuitesOverviewTab,
} from "pages/project"
import { ProjectLayout } from "pages/project/tabs/project-layout/project-layout"

import { config } from "shared/config"
import { getLang } from "shared/libs"
import "shared/styles/antd-override.css"
import "shared/styles/colors.css"
import "shared/styles/global.css"
import "shared/styles/variables-dark.css"
import "shared/styles/variables.css"

import { RequireAuth } from "./entities/auth/ui/require-auth"
import { DashboardPage } from "./pages/dashboard"
import { LogoutPage } from "./pages/logout/logout"
import { ProfilePage } from "./pages/profile/profile-page"

if (config.debugCss) {
  import("shared/styles/debug.css")
}

dayjs.extend(isToday)
dayjs.extend(updateLocale)
dayjs.updateLocale(getLang(), {
  weekStart: 1,
})

const OldUrlProjectRedirect = () => {
  const { projectId, tab } = useParams()
  return <Navigate to={`/projects/${projectId}/${tab}`} replace />
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      {/* protected routes */}
      <Route element={<RequireAuth />}>
        <Route path="/" element={<Main />}>
          <Route index element={<DashboardPage />} />

          {/* administrations routes */}
          <Route
            path="administration/projects/:projectId/:tab"
            element={<OldUrlProjectRedirect />}
          />
          <Route path="administration/users" element={<AdministrationUsersPage />} />

          {/* projects routes */}
          <Route path="projects/:projectId">
            <Route element={<ProjectProvider />}>
              <Route element={<ProjectLayout />}>
                <Route index element={<Navigate to={ProjectTab.OVERVIEW} replace />} />
                <Route path={ProjectTab.OVERVIEW} element={<ProjectOverviewTabPage />} />
                <Route path={ProjectTab.PARAMETERS} element={<ProjectParametersTabPage />} />
                <Route path={ProjectTab.LABELS} element={<ProjectLabelsTabPage />} />
                <Route path={ProjectTab.STATUSES} element={<ProjectStatusesTabPage />} />
                <Route
                  path={ProjectTab.CUSTOM_ATTRIBUTES}
                  element={<ProjectCustomAttributesTabPage />}
                />
                <Route path={ProjectTab.SETTINGS} element={<ProjectSettingsTabPage />} />
                <Route
                  path={ProjectTab.ACCESS_MANAGEMENT}
                  element={<ProjectAccessManagementTabPage />}
                />
              </Route>

              <Route element={<ProjectMainPage />}>
                <Route path="suites">
                  <Route element={<TestSuiteLayout />}>
                    <Route index element={<TestSuitesOverviewTab />} />
                    <Route path=":testSuiteId" element={<TestSuitesOverviewTab />} />
                    <Route
                      path=":testSuiteId/custom-attributes"
                      element={<TestSuitesCustomAttributesTab />}
                    />
                    <Route path=":testSuiteId/attachments" element={<TestSuitesAttachmentsTab />} />
                  </Route>
                  <Route path="new-test-suite" element={<ChangeTestSuiteView type="create" />} />
                  <Route
                    path=":testSuiteId/edit-test-suite"
                    element={<ChangeTestSuiteView type="edit" />}
                  />
                  <Route path="new-test-case" element={<CreateTestCaseView />} />
                  <Route path="edit-test-case" element={<EditTestCaseView />} />
                </Route>

                <Route path="plans">
                  <Route element={<TestPlanLayout />}>
                    <Route index element={<TestPlansOverviewTab />} />
                    <Route path=":testPlanId" element={<TestPlansOverviewTab />} />
                    <Route path=":testPlanId/activity" element={<TestPlanActivityTab />} />
                    <Route
                      path=":testPlanId/custom-attributes"
                      element={<TestPlansCustomAttributesTab />}
                    />
                    <Route path=":testPlanId/attachments" element={<TestPlansAttachmentsTab />} />
                  </Route>
                  <Route path="new-test-plan" element={<ChangeTestPlanView type="create" />} />
                  <Route
                    path=":testPlanId/edit-test-plan"
                    element={<ChangeTestPlanView type="edit" />}
                  />
                </Route>
              </Route>
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
