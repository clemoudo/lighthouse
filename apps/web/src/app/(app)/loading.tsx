import { Skeleton, Card, Flex } from "antd"

export default function Loading() {
  return (
    <div className="w-full">
      <Skeleton active className="mb-8" />
      <Flex vertical gap={16}>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <Skeleton active avatar paragraph={{ rows: 2 }} />
          </Card>
        ))}
      </Flex>
    </div>
  )
}
