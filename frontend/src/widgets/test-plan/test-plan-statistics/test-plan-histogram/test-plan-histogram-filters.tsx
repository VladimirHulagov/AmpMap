import { ClockCircleOutlined, UndoOutlined } from "@ant-design/icons"
import { DatePicker, Flex, Input } from "antd"
import { SegmentedValue } from "antd/lib/segmented"
import dayjs, { Dayjs } from "dayjs"
import { useMeContext } from "processes"
import { NoUndefinedRangeValueType } from "rc-picker/lib/PickerInput/RangePicker"
import { ChangeEvent, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "shared/ui"
import { BracesIcon } from "shared/ui/icons"

import styles from "./styles.module.css"

interface Props {
  barType: SegmentedValue
  testPlanId?: number
  setAttribute: (attribute: string) => void
  dateHistogram: {
    start: Dayjs
    end: Dayjs
  }
  setDateHistogram: (dateHistogram: { start: Dayjs; end: Dayjs }) => void
  setBarType: (barType: SegmentedValue) => void
}

export const TestPlanHistogramFilters = ({
  barType,
  testPlanId,
  dateHistogram,
  setAttribute,
  setDateHistogram,
  setBarType,
}: Props) => {
  const { t } = useTranslation()
  const { userConfig, updateConfig } = useMeContext()
  const [attributeValue, setAttributeValue] = useState(
    userConfig?.ui?.graph_base_bar_attribute_input ?? ""
  )
  const testPlanIdConfigKey = testPlanId ?? "root"
  const updateUserDateConfig = async (value: string, field: "start_date" | "end_date") => {
    await updateConfig({
      ...userConfig,
      ui: {
        ...userConfig?.ui,
        test_plan: {
          ...userConfig?.ui?.test_plan,
          [testPlanIdConfigKey]: {
            [field]: value ?? userConfig?.ui?.test_plan[testPlanIdConfigKey][field],
          },
        },
      },
    })
  }

  const handleDatePickerChange = (value: Dayjs, field: "start_date" | "end_date") => {
    const valueFormat = value.format("YYYY-MM-DD") ?? undefined
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    setDateHistogram((prevState) => ({
      ...prevState,
      [field === "start_date" ? "start" : "end"]: value,
    }))
    updateUserDateConfig(valueFormat, field)
  }

  const handleAttributeChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === "") {
      setAttributeValue("")
      setAttribute("")
      await handleBarTypeChange("by_time")
      await updateConfig({
        ...userConfig,
        ui: {
          ...userConfig?.ui,
          graph_base_bar_attribute_input: "",
        },
      })
      return
    }
    setAttributeValue(e.target.value)
  }

  const handleSearchByAttribute = async () => {
    setAttribute(attributeValue)
    await updateConfig({
      ...userConfig,
      ui: {
        ...userConfig?.ui,
        graph_base_bar_attribute_input: attributeValue,
      },
    })
  }

  const handleResetUserDateConfig = async () => {
    setDateHistogram({
      start: dayjs().subtract(6, "days"),
      end: dayjs(),
    })
    await updateConfig({
      ...userConfig,
      ui: {
        ...userConfig?.ui,
        test_plan: {
          ...userConfig?.ui?.test_plan,
          [testPlanIdConfigKey]: undefined,
        },
      },
    })
  }

  const handleBarTypeChange = async (value: SegmentedValue) => {
    setBarType(value)
    await updateConfig({
      ...userConfig,
      ui: {
        ...userConfig?.ui,
        graph_base_bar_type: value,
      },
    })
  }

  const disabledDate = (current: dayjs.Dayjs) => {
    return dateHistogram.start.isSameOrAfter(current)
  }

  const hasUserDataConfig = !!userConfig?.ui?.test_plan?.[testPlanIdConfigKey]

  return (
    <div className={styles.filtersBlock}>
      <Flex gap={8}>
        <DatePicker
          onChange={(date) => handleDatePickerChange(date as unknown as Dayjs, "start_date")}
          size="middle"
          value={dateHistogram.start as unknown as NoUndefinedRangeValueType<Dayjs>}
          disabled={false}
          showTime={false}
          format="YYYY-MM-DD"
          picker="date"
          placeholder={t("Start date")}
          needConfirm={false}
          maxDate={dateHistogram.end}
          allowClear={false}
          data-testid="test-plan-histogram-start-date-picker"
        />
        <DatePicker
          onChange={(date) => handleDatePickerChange(date as unknown as Dayjs, "end_date")}
          size="middle"
          value={dateHistogram.end as unknown as NoUndefinedRangeValueType<Dayjs>}
          disabled={false}
          showTime={false}
          maxDate={dayjs()}
          format="YYYY-MM-DD"
          picker="date"
          placeholder={t("Finish date")}
          needConfirm={false}
          allowClear={false}
          disabledDate={disabledDate}
          data-testid="test-plan-histogram-end-date-picker"
        />
        {hasUserDataConfig && (
          <Button
            onClick={handleResetUserDateConfig}
            id="reset-date-user-config"
            color="secondary-linear"
          >
            <UndoOutlined />
          </Button>
        )}
      </Flex>
      {barType === "by_attr" && (
        <div
          style={{ display: "flex", flexDirection: "column", position: "relative" }}
          data-testid="test-plan-histogram-filters-by-attr"
        >
          <Input.Search
            style={{ width: 240 }}
            allowClear
            onChange={handleAttributeChange}
            value={attributeValue}
            loading={false}
            onSearch={handleSearchByAttribute}
            placeholder={t("Search by attribute")}
            data-testid="test-plan-histogram-filters-by-attr-input"
          />
        </div>
      )}
      <Flex gap={8} id="test-plan-statistic-histogram-tabs">
        <Button
          onClick={() => handleBarTypeChange("by_time")}
          icon={<ClockCircleOutlined data-testid="histogram-by-time-icon" />}
          data-testid="btn-pie-chart"
          color={barType !== "by_time" ? "ghost" : "secondary-linear"}
          shape="square"
        />
        <Button
          onClick={() => handleBarTypeChange("by_attr")}
          icon={<BracesIcon data-testid="histogram-by-attr-icon" />}
          data-testid="btn-bar-chart"
          color={barType !== "by_attr" ? "ghost" : "secondary-linear"}
          shape="square"
        />
      </Flex>
    </div>
  )
}
