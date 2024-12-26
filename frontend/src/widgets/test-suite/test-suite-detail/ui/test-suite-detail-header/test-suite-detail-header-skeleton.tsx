import { Flex } from "antd"

import { Skeleton } from "shared/ui"

export const TestSuiteDetailHeaderSkeleton = () => {
  return (
    <Flex vertical>
      <Skeleton width="30%" height={28} style={{ marginBottom: 16 }} />
      <Flex gap={8} wrap>
        <Skeleton width={200} height={32} />
        <Skeleton width={85} height={32} />
        <Skeleton width={85} height={32} />
        <Skeleton width={85} height={32} />
      </Flex>
    </Flex>
  )
}
