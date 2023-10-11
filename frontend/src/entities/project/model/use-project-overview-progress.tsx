import { FetchBaseQueryError } from "@reduxjs/toolkit/dist/query"
import { DatePicker, Progress, Tooltip } from "antd"
import { ColumnsType } from "antd/lib/table"
import moment, { Moment } from "moment"
import { RangeValue } from "rc-picker/lib/interface"
import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"

import { colors, formatBaseDate } from "shared/config"

import { useLazyGetProjectProgressQuery } from "../api"

interface ProgressItemProps {
  percent: number
  countStr: string
}

const ProgressItem = ({ percent, countStr }: ProgressItemProps) => {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", flexDirection: "row" }}>
        <Progress percent={percent} strokeColor={colors.accent} showInfo={false} />
        <span style={{ marginLeft: 6, fontSize: 14 }}>{percent}%</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", fontSize: 12 }}>
        <span>{countStr}</span>
      </div>
    </div>
  )
}

export const useProjectOverviewProgress = () => {
  const { projectId } = useParams<ParamProjectId>()
  const [getProgress, { data }] = useLazyGetProjectProgressQuery()
  const [isLoading, setIsLoading] = useState(false)

  const disabledDateStart = (current: Moment) => {
    return !current.isBefore(moment())
  }

  const handleChange = async (values: RangeValue<moment.Moment>) => {
    if (!values || !projectId) return
    const [dateStart, dateEnd] = values
    if (!dateStart || !dateEnd) return

    try {
      setIsLoading(true)
      await getProgress({
        projectId,
        period_date_start: formatBaseDate(dateStart),
        period_date_end: formatBaseDate(dateEnd),
      })
    } catch (err) {
      const error = err as FetchBaseQueryError
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const columns: ColumnsType<ProjectsProgress> = [
    {
      title: "Test Plan",
      dataIndex: "title",
      key: "title",
      ellipsis: {
        showTitle: false,
      },
      render: (_, record) => {
        return (
          <Link
            id={`overview-test-plan-link-${record.title}`}
            to={`/projects/${projectId}/plans/${record.id}`}
          >
            <Tooltip placement="topLeft" title={record.title}>
              {record.title}
            </Tooltip>
          </Link>
        )
      },
    },
    {
      title: "Total",
      dataIndex: "tests_total",
      key: "tests_total",
      width: "180px",
      render: (_, record) => {
        const percent = Math.round(
          (Number(record.tests_progress_total) / Number(record.tests_total)) * 100
        )
        const countStr = `${record.tests_progress_total} / ${record.tests_total}`

        return (
          <ProgressItem percent={record.tests_progress_total ? percent : 0} countStr={countStr} />
        )
      },
    },
    {
      title: (
        <DatePicker.RangePicker
          defaultValue={[moment().subtract(7, "days"), moment()]}
          onChange={handleChange}
          disabledDate={disabledDateStart}
          size="small"
        />
      ),
      dataIndex: "tests_progress_period",
      key: "tests_progress_period",
      width: "250px",
      render: (_, record) => {
        const percent = Math.round(
          (Number(record.tests_progress_period) / Number(record.tests_progress_total)) * 100
        )
        return (
          <ProgressItem
            percent={record.tests_progress_total ? percent : 0}
            countStr={String(record.tests_progress_period)}
          />
        )
      },
    },
  ]

  useEffect(() => {
    if (!projectId) return
    setIsLoading(true)
    getProgress({
      projectId,
      period_date_start: formatBaseDate(moment().subtract(7, "days")),
      period_date_end: formatBaseDate(moment()),
    }).finally(() => {
      setIsLoading(false)
    })
  }, [projectId])

  return {
    columns,
    data,
    isLoading,
    handleChange,
    disabledDateStart,
  }
}
