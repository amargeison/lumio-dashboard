import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <Header />
      <main
        className="min-h-screen pt-16"
        style={{ paddingLeft: '200px', backgroundColor: '#07080F' }}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </>
  )
}
