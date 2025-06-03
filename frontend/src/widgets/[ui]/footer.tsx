import { Divider, Layout } from "antd"

import { Copyright } from "shared/ui"

const { Footer } = Layout

interface Props {
  style?: React.CSSProperties
}

export const FooterView = ({ style }: Props) => {
  return (
    <div style={style}>
      <Divider
        style={{
          width: "90%",
          marginBottom: 4,
          marginTop: 4,
          minWidth: "90%",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      />
      <Footer
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 16px",
          height: 50,
          background: "transparent",
        }}
      >
        <Copyright />
      </Footer>
    </div>
  )
}
