import { LinkOutlined } from "@ant-design/icons"
import { Flex, message } from "antd"
import { useTranslation } from "react-i18next"

interface Props extends HTMLDataAttribute {
  link: string
}

export const CopyLinkContextMenu = ({ link, ...props }: Props) => {
  const { t } = useTranslation()

  const handleCopyLink = () => {
    navigator.clipboard.writeText(link)
    message.info("Link copied to clipboard")
  }

  return (
    <Flex gap={6} align="center" onClick={handleCopyLink} {...props}>
      <LinkOutlined style={{ fontSize: 14 }} />
      {t("Copy link")}
    </Flex>
  )
}
