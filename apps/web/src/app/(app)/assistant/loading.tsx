import { Skeleton, Space, Flex, Card } from "antd"

export default function Loading() {
  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4">
      <Space orientation="vertical" size={32} className="w-full">
        {/* Assistant Welcome message skeleton */}
        <Flex gap={16}>
          <Skeleton.Avatar active size={40} shape="circle" />
          <Flex vertical gap={8} className="flex-1 max-w-[80%]">
            <Skeleton.Input active size="small" style={{ width: 40 }} />
            <Card className="rounded-2xl rounded-tl-none shadow-sm">
              <Skeleton active paragraph={{ rows: 3 }} title={false} />
            </Card>
          </Flex>
        </Flex>

        {/* User message skeleton */}
        <Flex gap={16} style={{ flexDirection: "row-reverse" }}>
          <Skeleton.Avatar active size={40} shape="circle" />
          <Flex vertical gap={8} align="end" className="flex-1 max-w-[80%]">
            <Skeleton.Input active size="small" style={{ width: 40 }} />
            <Card className="rounded-2xl rounded-tr-none shadow-sm bg-primary/5">
              <Skeleton active paragraph={{ rows: 1 }} title={false} />
            </Card>
          </Flex>
        </Flex>

        {/* Another assistant message skeleton */}
        <Flex gap={16}>
          <Skeleton.Avatar active size={40} shape="circle" />
          <Flex vertical gap={8} className="flex-1 max-w-[80%]">
            <Skeleton.Input active size="small" style={{ width: 40 }} />
            <Card className="rounded-2xl rounded-tl-none shadow-sm">
              <Skeleton active paragraph={{ rows: 2 }} title={false} />
            </Card>
          </Flex>
        </Flex>
      </Space>
    </div>
  )
}
