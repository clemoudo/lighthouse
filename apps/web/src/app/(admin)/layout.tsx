import { AppShell } from "@/components/app-shell"
import { AuthGuard } from "@/components/auth/auth-guard"

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  )
}

export default AdminLayout
