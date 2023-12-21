import { EditOutlined } from "@ant-design/icons"
import { Breadcrumb, Button, Card, Col, Divider, Layout, PageHeader, Row } from "antd"
import { useDispatch } from "react-redux"
import { ProfileAvatar } from "widgets"

import { useGetMeQuery } from "entities/user/api"
import { showEditProfileModal } from "entities/user/model"

import { ContainerLoader, Field } from "shared/ui"

import { EditProfileModal } from "widgets/user"

import styles from "./styles.module.css"

const { Content } = Layout

export const ProfileFields = ({ profile }: { profile: User }) => {
  return (
    <>
      <Field title="Username" value={profile.username} />
      <Field title="Email" value={profile.email} />
      <Field title="First Name" value={profile.first_name} />
      <Field title="Last Name" value={profile.last_name} />
    </>
  )
}

export const ProfilePage = () => {
  const dispatch = useDispatch()
  const { data: profile, isLoading } = useGetMeQuery()

  const breadcrumbItems = [<Breadcrumb.Item key="profile">Profile</Breadcrumb.Item>]

  const handleClickEdit = () => {
    dispatch(showEditProfileModal())
  }

  return (
    <>
      <PageHeader
        breadcrumbRender={() => <Breadcrumb>{breadcrumbItems}</Breadcrumb>}
        title="Profile"
      ></PageHeader>
      <Row style={{ margin: "24px" }}>
        <Col flex="0 1 260px">
          <div className={styles.avatarWrapper}>
            <ProfileAvatar />
          </div>
        </Col>
        <Col flex={9}>
          <Content style={{ marginLeft: "24px" }}>
            <Card>
              <Row align={"middle"}>
                <Col flex={"auto"}>
                  <p style={{ margin: 0, fontSize: 18 }}>General Details</p>
                </Col>
                <Col flex={"none"}>
                  <Button id="edit-profile" onClick={handleClickEdit} icon={<EditOutlined />}>
                    Edit
                  </Button>
                </Col>
              </Row>
              <Divider />
              {isLoading || !profile ? <ContainerLoader /> : <ProfileFields profile={profile} />}
            </Card>
          </Content>
        </Col>
      </Row>
      <EditProfileModal />
    </>
  )
}
