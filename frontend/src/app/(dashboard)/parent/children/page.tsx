'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PlusIcon } from '@heroicons/react/24/outline'
import { ChildCard } from '@/components/dashboard/child-card'
import Link from 'next/link'

interface Profile {
    id: string
    full_name: string | null
    email: string | null
    role: 'parent' | 'child'
}

export default function ChildrenPage() {
    const [children, setChildren] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchChildren() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('parent_id', user.id)

            if (data) setChildren(data as Profile[])
            setLoading(false)
        }

        fetchChildren()
    }, [supabase])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                    Quản Lý Hồ Sơ Trẻ
                </h2>
                <Link
                    href="/parent/children/create"
                    className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                    <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                    Thêm Hồ Sơ Mới
                </Link>
            </div>

            {loading ? (
                <div>Đang tải danh sách...</div>
            ) : children.length === 0 ? (
                <div className="text-center py-12 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-gray-500">Chưa có hồ sơ trẻ nào được tạo.</p>
                    <p className="text-sm text-gray-400 mt-1">Bấm "Thêm Hồ Sơ Mới" để bắt đầu.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {children.map((child) => (
                        <ChildCard
                            key={child.id}
                            name={child.full_name || 'Chưa đặt tên'}
                            email={child.email || ''}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
