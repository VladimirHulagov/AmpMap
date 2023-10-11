import { Tooltip } from "antd"
import { Link, useParams } from "react-router-dom"

import { TestPlanActivityLink } from "entities/test-plan/ui/test-plan-activity"

import { getRouteTestPlanActivityBreadCrumbs } from "../../lib"

export const useTestPlanActivityBreadcrumbs = () => {
  const { projectId } = useParams<ParamProjectId & ParamTestPlanId>()

  const renderBreadCrumbs = (value: BreadCrumbsActivityResult) => {
    const initArray = getRouteTestPlanActivityBreadCrumbs(value).reverse()

    if (initArray.length > 2) {
      const newArray = [initArray[0], null, initArray[initArray.length - 1]]

      return (
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
          {newArray.map((nItem) => {
            if (!nItem) {
              return (
                <Tooltip
                  key="no-key"
                  overlayClassName="test-plan-activity-breadcrumbs"
                  title={initArray.slice(1, -1).map((iItem, iIndex, iArray) => (
                    <TestPlanActivityLink
                      key={iItem.id}
                      projectId={projectId || ""}
                      planId={String(iItem.id)}
                      title={iItem.title}
                      isVisibleSeparator={iArray.length > 1 && iArray.length !== iIndex + 1}
                    />
                  ))}
                >
                  <span className="ant-breadcrumb-separator">...</span>
                </Tooltip>
              )
            }

            return (
              <div key={nItem.id}>
                <Link to={`/projects/${projectId}/plans/${nItem.id}`}>{nItem.title}</Link>
              </div>
            )
          })}
        </div>
      )
    }

    return (
      <div style={{ display: "flex", flexDirection: "row" }}>
        {initArray.map((item, index, array) => (
          <TestPlanActivityLink
            key={item.id}
            projectId={projectId || ""}
            planId={String(item.id)}
            title={item.title}
            isVisibleSeparator={array.length > 1 && array.length !== index + 1}
          />
        ))}
      </div>
    )
  }

  return {
    renderBreadCrumbs,
  }
}
