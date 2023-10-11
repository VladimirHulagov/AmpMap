import { Link } from "react-router-dom"

interface TestPlanActivityLinkProps {
  projectId: string
  planId: string
  title: string
  isVisibleSeparator: boolean
}

export const TestPlanActivityLink = ({
  projectId,
  planId,
  title,
  isVisibleSeparator,
}: TestPlanActivityLinkProps) => {
  return (
    <div>
      <Link to={`/projects/${projectId}/plans/${planId}`}>{title}</Link>
      {isVisibleSeparator && <span className="ant-breadcrumb-separator">/</span>}
    </div>
  )
}
