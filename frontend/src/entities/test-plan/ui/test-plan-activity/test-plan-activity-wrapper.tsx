import { Typography } from "antd"
import { useParams } from "react-router"
import { Link } from "react-router-dom"

import { ContainerLoader } from "shared/ui"

import { useGetTestPlanParentsQuery } from "../../api"
import { useTestPlanActivity } from "../../model"
import { TestPlanActivityFilers } from "./test-plan-activity-filters"
import { TestPlanActivityTable } from "./test-plan-activity-table"

export const TestPlanActivityWrapper = () => {
  const testPlanActivity = useTestPlanActivity()
  const { testPlanId, projectId } = useParams<ParamTestPlanId & ParamProjectId>()
  const { data: testPlan, isLoading } = useGetTestPlanParentsQuery(testPlanId ?? "", {
    skip: !testPlanId,
  })

  if (isLoading || !testPlan || !projectId || !testPlanId) return <ContainerLoader />

  return (
    <div>
      <Typography.Text style={{ fontSize: 20, marginBottom: 24, display: "block" }}>
        Activity - <Link to={`/projects/${projectId}/plans/${testPlanId}`}>{testPlan.title}</Link>
      </Typography.Text>
      <TestPlanActivityFilers testPlanActivity={testPlanActivity} />
      <TestPlanActivityTable testPlanActivity={testPlanActivity} />
    </div>
  )
}
