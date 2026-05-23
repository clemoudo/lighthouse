import { AppShell } from "@/components/app-shell"
import { AdminGuard } from "@/components/admin/admin-guard"

export const dynamic = "force-dynamic"

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AdminGuard>
      <AppShell>{children}</AppShell>
    </AdminGuard>
  )
}

export default AdminLayout
