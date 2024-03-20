import { Col, Layout, Row } from "antd"

import { AvatarView as Avatar } from "shared/ui/avatar/avatar"

const { Header } = Layout

const HeaderView: React.FC = () => {
  // TODO
  // const theme = useAppSelector(selectTheme)
  // const dispatch = useAppDispatch()

  // const toggleTheme = (value: SegmentedValue) => {
  //   const newTheme = value as ThemeType
  //   dispatch(setTheme(newTheme))
  // }

  return (
    <Header className="header site-layout-background">
      <Row>
        <Col flex="auto"></Col>
        {/* <Col flex="none" style={{ marginRight: 20 }}>
          <Segmented
            onChange={toggleTheme}
            value={theme}
            options={[
              { value: "light", icon: <SunIcon /> },
              { value: "dark", icon: <MoonIcon /> },
            ]}
          />
        </Col> */}
        <Col flex="none">
          <Avatar />
        </Col>
      </Row>
    </Header>
  )
}

export { HeaderView }
