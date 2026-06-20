import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { AuthGuard } from '@/components/admin/AuthGuard'

interface AdminLayoutProps {
  children: React.ReactNode
  params: Promise<{ tenant: string }>
}

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { tenant } = await params

  return (
    <AuthGuard tenant={tenant}>
      <div className="flex h-screen overflow-hidden bg-background">
        <AdminSidebar tenant={tenant} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  )
}
