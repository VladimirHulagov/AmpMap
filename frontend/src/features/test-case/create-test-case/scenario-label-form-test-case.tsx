import { Checkbox, Flex, Space } from "antd"
import { Control, Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"

export const ScenarioLabelFormTestCase = ({
  control,
}: {
  control: Control<TestCaseFormData, unknown>
}) => {
  const { t } = useTranslation()
  return (
    <Flex style={{ width: "100%" }} align="center" justify="space-between">
      <span>{t("Scenario")}</span>
      <Controller
        name="is_steps"
        control={control}
        render={({ field }) => (
          <Space.Compact style={{ marginLeft: "auto", marginBottom: 0 }}>
            <Checkbox id="edit-steps-checkbox" checked={field.value} onChange={field.onChange}>
              {t("Steps")}
            </Checkbox>
          </Space.Compact>
        )}
      />
    </Flex>
  )
}
