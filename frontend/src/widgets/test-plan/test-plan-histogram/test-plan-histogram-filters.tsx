import { ClockCircleOutlined, UndoOutlined } from "@ant-design/icons"
import { Button, DatePicker, Input, Segmented } from "antd"
import { SegmentedValue } from "antd/lib/segmented"
import moment from "moment"
import { RangeValue } from "rc-picker/lib/interface"
import { ChangeEvent, useState } from "react"

import { useUserConfig } from "entities/user/model"

import { BracesIcon } from "shared/ui/icons"

interface Props {
  barType: SegmentedValue
  testPlanId: string
  setAttribute: (attribute: string) => void
  dateHistogram: {
    start: moment.Moment
    end: moment.Moment
  }
  setDateHistogram: (dateHistogram: { start: moment.Moment; end: moment.Moment }) => void
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
  const { updateConfig, userConfig } = useUserConfig()
  const [attributeValue, setAttributeValue] = useState(
    userConfig.ui.graph_base_bar_attribute_input ?? ""
  )

  const updateUserDateConfig = async (start: string, end: string) => {
    await updateConfig({
      ...userConfig,
      ui: {
        ...userConfig.ui,
        test_plan: {
          ...userConfig.ui.test_plan,
          [testPlanId]: {
            start_date: start,
            end_date: end,
          },
        },
      },
    })
  }

  const handleDatePickerChange = (values: RangeValue<moment.Moment>) => {
    if (!values) return
    const [start, end] = values
    if (!start || !end) return
    setDateHistogram({ start, end })
    updateUserDateConfig(start.format("YYYY-MM-DD"), end.format("YYYY-MM-DD"))
  }

  const handleAttributeChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === "") {
      setAttributeValue("")
      setAttribute("")
      await handleBarTypeChange("by_time")
      await updateConfig({
        ...userConfig,
        ui: {
          ...userConfig.ui,
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
        ...userConfig.ui,
        graph_base_bar_attribute_input: attributeValue,
      },
    })
  }

  const handleResetUserDateConfig = async () => {
    setDateHistogram({
      start: moment().subtract(6, "days"),
      end: moment(),
    })
    await updateConfig({
      ...userConfig,
      ui: {
        ...userConfig.ui,
        test_plan: {
          ...userConfig.ui.test_plan,
          [testPlanId]: undefined,
        },
      },
    })
  }

  const handleBarTypeChange = async (value: SegmentedValue) => {
    setBarType(value)
    await updateConfig({
      ...userConfig,
      ui: {
        ...userConfig.ui,
        graph_base_bar_type: value,
      },
    })
  }

  const hasUserDataConfig = !!userConfig.ui?.test_plan?.[testPlanId]

  return (
    <div
      style={{
        height: 40,
        marginLeft: "auto",
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div>
        <DatePicker.RangePicker
          onChange={handleDatePickerChange}
          size="middle"
          style={
            hasUserDataConfig
              ? {
                  width: 240,
                  height: "40px",
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                }
              : { width: 240, height: "40px" }
          }
          value={[dateHistogram.start, dateHistogram.end]}
        />
        {hasUserDataConfig && (
          <Button
            style={{
              borderLeft: "none",
              height: "40px",
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
            }}
            onClick={handleResetUserDateConfig}
            id="reset-date-user-config"
          >
            <UndoOutlined />
          </Button>
        )}
      </div>

      {barType === "by_attr" && (
        <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
          <Input.Search
            style={{ width: 240 }}
            allowClear
            onChange={handleAttributeChange}
            value={attributeValue}
            loading={false}
            onSearch={handleSearchByAttribute}
            placeholder="Search by attribute"
          />
          <span
            style={{
              fontSize: 13,
              position: "absolute",
              bottom: -20,
              left: 0,
              color: "#999",
            }}
          >
            Filter by test result attribute
          </span>
        </div>
      )}
      <Segmented
        id="test-plan-statistic-histogram-tabs"
        options={[
          {
            value: "by_time",
            icon: <ClockCircleOutlined />,
          },
          {
            value: "by_attr",
            icon: <BracesIcon />,
          },
        ]}
        onChange={handleBarTypeChange}
        size="large"
        defaultValue={barType}
        value={barType}
      />
    </div>
  )
}
