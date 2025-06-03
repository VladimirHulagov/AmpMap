import { Alert, Flex, Select, Typography } from "antd"
import { Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { TestCaseFields } from "entities/test-case/ui/test-case-fields"

import { CopyTestCase, DeleteTestCase, EditTestCase } from "features/test-case"
import { ArchiveTestCase } from "features/test-case/archive-test-case/archive-test-case"

import { ArchivedTag, Drawer } from "shared/ui"

import styles from "./styles.module.css"
import { TestCaseDetailTabs } from "./test-case-detail-tabs"
import { useTestCaseDetail } from "./use-test-case-detail"

export const TestCaseDetail = () => {
  const { t } = useTranslation()
  const {
    testCase,
    showVersion,
    versionData,
    control,
    isFetching,
    handleClose,
    handleChangeVersion,
    handleRestoreVersion,
    handleRefetch,
  } = useTestCaseDetail()

  const isLastVersion = testCase?.versions[0] === showVersion
  const hasVersion = !!testCase?.versions && testCase?.versions.length > 1

  return (
    <Drawer
      id="drawer-test-case-details"
      onClose={handleClose}
      isOpen={!!testCase}
      isLoading={isFetching}
      header={
        testCase && (
          <>
            {hasVersion && (
              <Controller
                name="select"
                control={control}
                defaultValue={testCase.current_version}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder={t("Version")}
                    style={{ minWidth: "100px", marginRight: "auto" }}
                    options={versionData}
                    defaultValue={Number(testCase.current_version)}
                    onChange={handleChangeVersion}
                    value={showVersion}
                    data-testid="test-case-detail-version-select"
                  />
                )}
              />
            )}
            <Flex gap={8} style={{ marginLeft: !hasVersion ? "auto" : undefined }}>
              <CopyTestCase testCase={testCase} onSubmit={handleRefetch} />
              <EditTestCase testCase={testCase} />
              {!testCase.source_archived ? (
                <ArchiveTestCase testCase={testCase} onSubmit={handleRefetch} />
              ) : (
                <DeleteTestCase testCase={testCase} onSubmit={handleRefetch} />
              )}
            </Flex>
            <Flex gap={8} align="center" style={{ width: "100%" }}>
              {testCase.is_archive && <ArchivedTag className={styles.archiveIcon} />}
              <Typography.Title
                level={3}
                className={styles.title}
                data-testid="test-case-detail-title"
              >
                {testCase.name}
              </Typography.Title>
            </Flex>
          </>
        )
      }
    >
      <>
        {testCase && !isLastVersion && (
          <Alert
            banner
            className={styles.versionAlert}
            data-testid="test-case-detail-version-warning"
            message={
              <span>
                {t("This isn't the latest version.")}{" "}
                <a onClick={handleRestoreVersion}>{t("Restore")}</a>
              </span>
            }
          />
        )}
        {testCase && (
          <>
            <TestCaseFields testCase={testCase} />
            <TestCaseDetailTabs testCase={testCase} onChangeVersion={handleChangeVersion} />
          </>
        )}
      </>
    </Drawer>
  )
}
