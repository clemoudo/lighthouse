import React from "react"
import { Flex } from "antd"

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Flex align="center" justify="center" className="min-h-screen bg-primary p-4">
      <div className="w-full max-w-md">{children}</div>
    </Flex>
  )
}

export default AuthLayout
