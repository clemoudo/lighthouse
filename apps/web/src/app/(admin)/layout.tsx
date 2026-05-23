import { AppShell } from "@/components/app-shell"
import { AdminGuard } from "@/components/admin/admin-guard"
import { Suspense } from "react"
import { Spin, Flex } from "antd"

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AppShell>
      <Suspense
        fallback={
          <Flex align="center" justify="center" className="h-[60vh] w-full">
            <Spin size="large" description="Chargement..." />
          </Flex>
        }
      >
        <AdminGuard>{children}</AdminGuard>
      </Suspense>
    </AppShell>
  )
}

export default AdminLayout
