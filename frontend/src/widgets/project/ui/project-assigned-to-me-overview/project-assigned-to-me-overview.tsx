import { Empty, Flex, Typography } from "antd"
import { useMeContext } from "processes"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useGetTestPlanStatisticsQuery } from "entities/test-plan/api"

import { useProjectContext } from "pages/project"

import { ContainerLoader } from "shared/ui"

import { ProjectAssignedToMeOverviewStatistic } from "./ui/project-assigned-to-me-overview-statistic"
import { ProjectAssignedToMeOverviewTree } from "./ui/project-assigned-to-me-overview-tree"

export const ProjectAssignedToMeOverview = () => {
  const { t } = useTranslation()
  const { me } = useMeContext()
  const project = useProjectContext()
  const { data = [], isFetching } = useGetTestPlanStatisticsQuery(
    {
      project: project.id,
      parent: null,
      assignee: me?.id ? [me.id.toString()] : undefined,
    },
    { skip: !me?.id }
  )

  const total = useMemo(() => {
    return data.reduce((acc, item) => acc + item.value, 0)
  }, [data])

  return (
    <Flex vertical style={{ flex: "1 1" }}>
      <Typography.Title level={3} style={{ marginBottom: 24 }}>
        {t("Assigned to me")}
      </Typography.Title>
      {isFetching && (
        <Flex align="center" justify="center" flex={1}>
          <ContainerLoader />
        </Flex>
      )}
      {!isFetching && !total && (
        <Flex align="center" justify="center" flex={1}>
          <Empty style={{ margin: "16px 0" }} />
        </Flex>
      )}
      {!isFetching && !!total && (
        <Flex vertical gap={32}>
          <ProjectAssignedToMeOverviewStatistic statistics={data} />
          <ProjectAssignedToMeOverviewTree />
        </Flex>
      )}
    </Flex>
  )
}
