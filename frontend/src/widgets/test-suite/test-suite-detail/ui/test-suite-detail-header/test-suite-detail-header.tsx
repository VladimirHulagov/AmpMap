import { Col, Divider, Flex, Row, Typography } from "antd"
import { TreebarContext } from "processes"
import { memo, useContext, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { useLazyGetTestSuiteAncestorsQuery } from "entities/suite/api"

import { CopySuite, CreateSuite, DeleteSuite, EditSuite } from "features/suite"

import { Markdown } from "shared/ui"

import {
  refetchNodeAfterCreateOrCopy,
  refetchNodeAfterDelete,
  refetchNodeAfterEdit,
} from "widgets/[ui]/treebar/utils"
import { TestCasesTreeContext } from "widgets/test-case"

interface Props {
  suite: Suite
  refetch: () => void
}

export const TestSuiteDetailHeader = memo(({ suite, refetch }: Props) => {
  const { t } = useTranslation()
  const { treebar } = useContext(TreebarContext)!
  const { testCasesTree } = useContext(TestCasesTreeContext)!
  const { testSuiteId } = useParams<ParamTestSuiteId>()
  const [isShowMore, setIsShowMore] = useState(false)

  const [getAncestors] = useLazyGetTestSuiteAncestorsQuery()

  const descriptionLines = useMemo(() => {
    return suite?.description.split(/\r\n|\r|\n/) ?? []
  }, [suite])

  const shortDesc = useMemo(() => {
    const text = descriptionLines.slice(0, 3).join("\n")
    if (descriptionLines.length > 3 || text.length > 300) return `${text.slice(0, 300)}...`
    return text
  }, [descriptionLines])

  const handleShowMoreClick = () => {
    setIsShowMore((prevState) => !prevState)
  }

  const refetchParentAfterCreateOrCopy = async (updatedEntity: CopySuiteResponse) => {
    const id = updatedEntity?.parent?.id ?? null
    await testCasesTree.current?.refetchNodeBy((node) => node.id === id && !node.props.isLeaf)
    if (!treebar.current) {
      return
    }

    await refetchNodeAfterCreateOrCopy(treebar.current, updatedEntity)
  }

  const refetchParentAfterDelete = async (updatedEntity: Suite) => {
    const id = updatedEntity?.parent?.id ?? null
    await testCasesTree.current?.refetchNodeBy((node) => node.id === id && !node.props.isLeaf)
    if (!treebar.current) {
      return
    }

    await refetchNodeAfterDelete(treebar.current, updatedEntity)
  }

  const refetchParentAfterEdit = async (updatedEntity: SuiteResponseUpdate, oldEntity: Suite) => {
    refetch()
    await testCasesTree.current?.initRoot({ initParent: testSuiteId })
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
      <Typography.Title level={2} style={{ marginBottom: 16 }} id="test-suite-title">
        {suite.name}
      </Typography.Title>
      <Flex wrap gap={8}>
        <CreateSuite suite={suite} onSubmit={refetchParentAfterCreateOrCopy} />
        <CopySuite suite={suite} onSubmit={refetchParentAfterCreateOrCopy} />
        <EditSuite suite={suite} onSubmit={refetchParentAfterEdit} />
        <DeleteSuite suite={suite} onSubmit={refetchParentAfterDelete} />
      </Flex>
      {suite.description.length ? (
        <>
          <Divider plain orientation="left">
            {t("Description")}
          </Divider>
          <Row align="middle">
            <Col flex="auto">
              <Markdown content={isShowMore ? suite.description : shortDesc} />
              {(descriptionLines.length > 3 || suite.description.length > 300) && (
                <button className="link-button" onClick={handleShowMoreClick}>
                  {isShowMore ? t("Hide more") : t("Show more")}
                </button>
              )}
            </Col>
          </Row>
        </>
      ) : null}
    </>
  )
})

TestSuiteDetailHeader.displayName = "TestSuiteDetailHeader"
