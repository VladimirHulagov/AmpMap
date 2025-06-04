import { DeleteOutlined } from "@ant-design/icons"
import { Flex, Input } from "antd"
import { useTranslation } from "react-i18next"

import { initInternalError } from "shared/libs"
import { antdModalConfirm, antdNotification } from "shared/libs/antd-modals"

interface Props {
  onSubmit: () => Promise<void>
  count: number
}

export const DeleteTests = ({ onSubmit, count }: Props) => {
  const { t } = useTranslation()

  const handleModalConfirm = async () => {
    try {
      await onSubmit()
      antdNotification.success("delete-tests", {
        description: t("Tests deleted successfully"),
      })
    } catch (err: unknown) {
      initInternalError(err)
    }
  }

  const handleClick = () => {
    const placeholder = count.toString()
    const text = t("Type $placeholder to confirm deletion of all $placeholder tests", {}).replace(
      /\$placeholder/g,
      placeholder
    )

    const texts = text.split(placeholder)

    let inputValue = ""

    const instance = antdModalConfirm("delete-tests", {
      title: t("Do you want to delete the selected tests?"),
      content: (
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            {texts.map((textPart: string, i: number) => {
              const isBold = i === 0
              return (
                <>
                  <p key={i}>{textPart}</p>
                  {i < texts.length - 1 && (
                    <span
                      style={isBold ? { fontWeight: "bold", fontSize: 16 } : {}}
                      data-testid={
                        isBold ? "delete-tests-placeholder" : "delete-tests-replacement-minor"
                      }
                    >
                      {placeholder}
                    </span>
                  )}
                </>
              )
            })}
          </div>
          <Input
            onChange={(e) => {
              inputValue = e.target.value
              instance.update({
                okButtonProps: {
                  disabled: inputValue.toLowerCase() !== placeholder.toLowerCase(),
                },
              })
            }}
            onKeyDown={(e) => {
              const arrowKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]
              if (arrowKeys.includes(e.key)) {
                e.stopPropagation()
              }
            }}
            placeholder={placeholder}
            data-testid="delete-tests-input"
          />
        </div>
      ),
      okText: t("Delete"),
      onOk: handleModalConfirm,
      okButtonProps: {
        disabled: true,
      },
    })
  }

  return (
    <>
      <Flex align="center" id="delete-bulk-tests-menu-item" onClick={handleClick}>
        <DeleteOutlined width={16} height={16} style={{ marginRight: 8 }} />
        {t("Delete")}
      </Flex>
    </>
  )
}

DeleteTests.displayName = "DeleteTests"
