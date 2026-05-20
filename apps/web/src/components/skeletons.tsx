"use client"

import { Card, Skeleton, Space } from "antd"

export const CurriculumSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="shadow-sm">
          <div className="flex items-start gap-4 mb-4">
            <Skeleton.Button active shape="square" size="large" />
            <div className="flex-1">
              <Skeleton active paragraph={{ rows: 1 }} title={true} />
            </div>
          </div>
          <Space className="mb-4">
            <Skeleton.Button active size="small" />
            <Skeleton.Button active size="small" />
          </Space>
          <div className="pt-4 border-t border-border flex justify-between">
            <Skeleton.Input active size="small" />
            <Skeleton.Button active size="small" />
          </div>
        </Card>
      ))}
    </div>
  )
}

export const SearchResultSkeleton = () => {
  return (
    <div className="space-y-6">
      <Skeleton active paragraph={{ rows: 0 }} title={{ width: 200 }} className="px-1" />
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="shadow-sm border border-border">
            <div className="flex items-start justify-between gap-6 mb-4">
              <div className="flex-1">
                <Skeleton active title={{ width: "60%" }} paragraph={{ rows: 1 }} />
              </div>
              <Skeleton.Button active size="small" />
            </div>
            <Skeleton active paragraph={{ rows: 2 }} title={false} />
            <div className="mt-4 pt-4 border-t border-border flex justify-between">
              <Skeleton.Button active size="small" />
              <Skeleton.Button active size="small" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
