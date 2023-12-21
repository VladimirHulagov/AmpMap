import { Col, Layout, Row } from "antd"

import { AvatarView as Avatar } from "shared/ui/avatar/avatar"

const { Header } = Layout

const HeaderView: React.FC = () => {
  return (
    <Header className="header site-layout-background">
      <Row>
        <Col flex="auto"></Col>
        <Col flex="none">
          <Avatar />
        </Col>
      </Row>
    </Header>
  )
}

export { HeaderView }
