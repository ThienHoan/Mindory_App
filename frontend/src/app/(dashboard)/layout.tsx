import Sidebar from '@/components/layout/Sidebar'
import Navbar from '@/components/layout/Navbar'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Navbar />
                <main className="flex-1 overflow-y-auto px-4 pb-6 pt-3 sm:px-5 sm:pb-7 sm:pt-4 lg:px-6 lg:pb-8 lg:pt-4">
                    {children}
                </main>
            </div>
        </div>
    )
}
