import {
  BarChartOutlined,
  ClockCircleOutlined,
  PieChartOutlined,
  UndoOutlined,
} from "@ant-design/icons"
import { Button, DatePicker, Input, Row, Segmented } from "antd"
import { SegmentedValue } from "antd/lib/segmented"
import moment from "moment"
import { RangeValue } from "rc-picker/lib/interface"
import { ChangeEvent, useState } from "react"

import { useTestsTableParams } from "entities/test/model"

import { useUserConfig } from "entities/user/model"

import { Pie, StackedBar } from "shared/ui"
import { BracesIcon } from "shared/ui/icons"

import { useGetTestPlanHistogramQuery } from "../api"
import { useTestPlanStatistics } from "../model"

interface TestPlanStatisticsProps {
  testPlanId: string
}

export const TestPlanStatistics = ({ testPlanId }: TestPlanStatisticsProps) => {
  const { data: pieData } = useTestPlanStatistics(testPlanId)

  const { tableParams, setTableParams } = useTestsTableParams()
  const { updateConfig, userConfig } = useUserConfig()
  const [segment, setSegment] = useState<SegmentedValue>(userConfig.ui?.graph_base_type || "pie")
  const [barType, setBarType] = useState<SegmentedValue>(
    userConfig.ui?.graph_base_bar_type || "by_time"
  )
  const [dateHistogram, setDateHistogram] = useState({
    start: userConfig.ui?.test_plan?.[testPlanId]?.start_date
      ? moment(userConfig.ui?.test_plan?.[testPlanId]?.start_date)
      : moment().subtract(6, "days"),
    end: userConfig.ui?.test_plan?.[testPlanId]?.end_date
      ? moment(userConfig.ui?.test_plan?.[testPlanId]?.end_date)
      : moment(),
  })
  const [attribute, setAttribute] = useState(userConfig.ui.graph_base_bar_attribute_input || "")
  const [attributeValue, setAttributeValue] = useState(
    userConfig.ui.graph_base_bar_attribute_input || ""
  )
  const { data: histogramData } = useGetTestPlanHistogramQuery(
    {
      testPlanId,
      start_date: dateHistogram.start.format("YYYY-MM-DD"),
      end_date: dateHistogram.end.format("YYYY-MM-DD"),
      attribute: barType === "by_attr" ? attribute : undefined,
    },
    {
      skip: segment === "pie",
    }
  )

  const handleSegmentedChange = async (value: SegmentedValue) => {
    setSegment(value)
    await updateConfig({
      ...userConfig,
      ui: {
        ...userConfig.ui,
        graph_base_type: value,
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

  const handleDatePickerChange = async (values: RangeValue<moment.Moment>) => {
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

  const hasUserDataConfig = !!userConfig.ui?.test_plan?.[testPlanId]

  return (
    <div style={{ marginBottom: 16 }}>
      <Row style={{ marginBottom: 16, maxWidth: 800, paddingRight: 40 }}>
        <Segmented
          options={[
            {
              value: "pie",
              icon: <PieChartOutlined />,
            },
            {
              value: "bar",
              icon: <BarChartOutlined />,
            },
          ]}
          onChange={handleSegmentedChange}
          size="large"
          defaultValue={segment}
          value={segment}
        />
        {segment === "bar" && (
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
        )}
      </Row>
      <Row gutter={20}>
        <div style={{ height: 400, display: "flex", width: 800 }}>
          {segment === "pie" && (
            <Pie tableParams={tableParams} setTableParams={setTableParams} data={pieData || []} />
          )}
          {segment === "bar" && <StackedBar data={histogramData || []} />}
        </div>
      </Row>
    </div>
  )
}
