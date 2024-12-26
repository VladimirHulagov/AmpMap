import { HistoryOutlined } from "@ant-design/icons"
import { Button, Flex, Typography } from "antd"
import dayjs from "dayjs"
import { TreebarContext } from "processes"
import { memo, useContext } from "react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router-dom"

import { useLazyGetTestPlanAncestorsQuery } from "entities/test-plan/api"

import {
  ArchiveTestPlan,
  CopyTestPlan,
  CreateTestPlan,
  DeleteTestPlan,
  EditTestPlan,
} from "features/test-plan"

import { ArchivedTag, Markdown } from "shared/ui"

import {
  refetchNodeAfterArchive,
  refetchNodeAfterCreateOrCopy,
  refetchNodeAfterDelete,
  refetchNodeAfterEdit,
} from "widgets/[ui]/treebar/utils"
import { TestsTreeContext } from "widgets/tests"

import styles from "./styles.module.css"

interface Props {
  testPlan: TestPlan
  refetch: () => void
}

export const TestPlanDetailHeader = memo(({ testPlan, refetch }: Props) => {
  const { t } = useTranslation()
  const { treebar } = useContext(TreebarContext)!
  const { testsTree } = useContext(TestsTreeContext)!
  const { projectId, testPlanId } = useParams<ParamProjectId & ParamTestPlanId>()

  const [getAncestors] = useLazyGetTestPlanAncestorsQuery()

  const refetchParentAfterCreateOrCopy = async (updatedEntity: TestPlan) => {
    const id = updatedEntity?.parent?.id ?? null
    await testsTree.current?.refetchNodeBy((node) => node.id === id && !node.props.isLeaf)
    if (!treebar.current) {
      return
    }

    await refetchNodeAfterCreateOrCopy(treebar.current, updatedEntity)
  }

  const refetchParentAfterArchive = async (updatedEntity: TestPlan) => {
    const id = updatedEntity?.parent?.id ?? null
    await testsTree.current?.refetchNodeBy((node) => node.id === id && !node.props.isLeaf)
    if (!treebar.current) {
      return
    }

    await refetchNodeAfterArchive(treebar.current, updatedEntity)
  }

  const refetchParentAfterDelete = async (updatedEntity: TestPlan) => {
    const id = updatedEntity?.parent?.id ?? null
    await testsTree.current?.refetchNodeBy((node) => node.id === id && !node.props.isLeaf)
    if (!treebar.current) {
      return
    }

    await refetchNodeAfterDelete(treebar.current, updatedEntity)
  }

  const refetchParentAfterEdit = async (updatedEntity: TestPlan, oldEntity: TestPlan) => {
    refetch()
    await testsTree.current?.initRoot({ initParent: testPlanId })
    if (!treebar.current) {
      return
    }

    const fetchAncestors = (id: number) => {
      return getAncestors(
        {
          id,
          project: oldEntity.project,
        },
        false
      ).unwrap()
    }

    await refetchNodeAfterEdit(treebar.current, updatedEntity, oldEntity, fetchAncestors)
  }

  return (
    <>
      <Flex gap={8} style={{ marginBottom: 16 }}>
        {testPlan.is_archive && <ArchivedTag size="lg" />}
        <Typography.Title id="test-plan-title" level={2} className={styles.title}>
          {testPlan.title}
        </Typography.Title>
      </Flex>
      <Flex style={{ marginBottom: 12 }} vertical gap={16}>
        <Flex gap={96}>
          {testPlan.started_at && (
            <Flex vertical gap={16}>
              <Typography.Text className={styles.infoTitle}>{t("Start date")}</Typography.Text>
              <Typography.Text className={styles.infoValue}>
                {dayjs(testPlan.started_at).format("YYYY-MM-DD")}
              </Typography.Text>
            </Flex>
          )}
          {testPlan.due_date && (
            <Flex vertical gap={16}>
              <Typography.Text className={styles.infoTitle}>{t("Due date")}</Typography.Text>
              <Typography.Text className={styles.infoValue}>
                {dayjs(testPlan.due_date).format("YYYY-MM-DD")}
              </Typography.Text>
            </Flex>
          )}
          {testPlan.finished_at && (
            <Flex vertical gap={16}>
              <Typography.Text className={styles.infoTitle}>{t("Finish date")}</Typography.Text>
              <Typography.Text className={styles.infoValue}>
                {dayjs(testPlan.finished_at).format("YYYY-MM-DD")}
              </Typography.Text>
            </Flex>
          )}
        </Flex>
        {testPlan.description && (
          <Flex vertical>
            <Typography.Text className={styles.infoTitle}>{t("Description")}</Typography.Text>
            <Markdown content={testPlan.description} />
          </Flex>
        )}
      </Flex>
      <Flex wrap gap={8} style={{ marginLeft: "auto" }}>
        <Button type="default" icon={<HistoryOutlined />}>
          <Link to={`/projects/${projectId}/plans/${testPlanId}/activity`}>
            {t("View activity")}
          </Link>
        </Button>
        <CreateTestPlan testPlan={testPlan} onSubmit={refetchParentAfterCreateOrCopy} />
        <CopyTestPlan testPlan={testPlan} onSubmit={refetchParentAfterCreateOrCopy} />
        <EditTestPlan testPlan={testPlan} onSubmit={refetchParentAfterEdit} />
        {!testPlan.is_archive && (
          <ArchiveTestPlan testPlan={testPlan} onSubmit={refetchParentAfterArchive} />
        )}
        <DeleteTestPlan testPlan={testPlan} onSubmit={refetchParentAfterDelete} />
      </Flex>
    </>
  )
})

TestPlanDetailHeader.displayName = "TestPlanDetailHeader"
