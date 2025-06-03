import { CloseOutlined } from "@ant-design/icons"
import { Select } from "antd"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { UseFormLabelsProps } from "entities/label/model"

import { colors } from "shared/config"
import { HighLighterTesty } from "shared/ui"

import { Label } from "../label"
import styles from "./styles.module.css"

interface LabelWrapperProps {
  labelProps: UseFormLabelsProps
  disabled?: boolean
  fieldProps?: { onBlur: () => void }
  noAdding?: boolean
}

export const LabelWrapper = ({
  fieldProps,
  labelProps: {
    labels,
    searchValue,
    searchingLabels,
    setSearchValue,
    handleAddLabel,
    handleDeleteLabel,
    placeholder,
    handleClearLabels,
  },
  noAdding,
  disabled = false,
}: LabelWrapperProps) => {
  const { t } = useTranslation()

  const hasSearchingLabel = useMemo(() => {
    if (!searchValue.length) return true

    return searchingLabels.some((i) => i.name.toLowerCase() === searchValue.toLowerCase())
  }, [searchingLabels, searchValue])

  const isAlreadyAdded = useMemo(() => {
    if (!labels.length || !searchValue.length) return false

    if (labels.some((i) => i.name.toLowerCase() === searchValue.toLowerCase())) {
      return true
    }

    return false
  }, [labels, searchValue])

  const handleSelect = (label: string) => {
    if (label === "new") {
      handleAddLabel(searchValue)
      return
    }

    handleAddLabel(label)
  }

  return (
    <div className={styles.wrapper} data-testid="label-wrapper">
      <div className={styles.form}>
        <Select
          mode="multiple"
          searchValue={searchValue}
          placeholder={placeholder}
          disabled={disabled}
          onSearch={(newValue) => setSearchValue(newValue)}
          allowClear={{ clearIcon: <CloseOutlined /> }}
          style={{ width: "100%" }}
          onSelect={handleSelect}
          onBlur={fieldProps?.onBlur}
          filterOption={false}
          onClear={handleClearLabels}
          value={labels.map(({ name }) => name)}
          data-testid="label-wrapper-input"
          tagRender={({ label }) => (
            <Label
              color={colors.accent}
              className={styles.tag}
              content={String(label)}
              onDelete={() => {
                handleDeleteLabel(String(label))
              }}
            />
          )}
        >
          {!hasSearchingLabel && !isAlreadyAdded && !noAdding && (
            <Select.Option value="new" key="new" data-testid="label-wrapper-new-value">
              {`${searchValue} (${t("New label")})`}
            </Select.Option>
          )}
          {isAlreadyAdded && (
            <Select.Option
              value="isAdded"
              key="isAdded"
              data-testid="label-wrapper-value-is-added"
              disabled
            >
              {`${searchValue} (${t("Already added")})`}
            </Select.Option>
          )}
          {searchingLabels?.map(({ id, name }) => (
            <Select.Option value={name} key={id} data-testid={`label-wrapper-value-${name}`}>
              <HighLighterTesty searchWords={searchValue} textToHighlight={name} />
            </Select.Option>
          ))}
        </Select>
      </div>
    </div>
  )
}
