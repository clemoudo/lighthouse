import { AppShell } from "@/components/app-shell"
import { AdminGuard } from "@/components/admin/admin-guard"

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AdminGuard>
      <AppShell>{children}</AppShell>
    </AdminGuard>
  )
}

export default AdminLayout
