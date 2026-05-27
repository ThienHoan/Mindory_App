import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
    usePathname: vi.fn().mockReturnValue('/admin'),
    useRouter:   vi.fn().mockReturnValue({ push: vi.fn(), refresh: vi.fn() }),
}))

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({ auth: { signOut: vi.fn() } }),
}))

import AdminSidebar from '@/components/layout/AdminSidebar'

describe('AdminSidebar', () => {
    it('renders all menu items', () => {
        render(<AdminSidebar />)
        expect(screen.getByText('Tổng quan')).toBeInTheDocument()
        expect(screen.getByText('Môn học')).toBeInTheDocument()
        expect(screen.getByText('Bài học')).toBeInTheDocument()
        expect(screen.getByText('Quiz')).toBeInTheDocument()
        expect(screen.getByText('Đăng xuất')).toBeInTheDocument()
    })

    it('renders brand name', () => {
        render(<AdminSidebar />)
        expect(screen.getByText('Mindory')).toBeInTheDocument()
        expect(screen.getByText('Admin')).toBeInTheDocument()
    })

    it('highlights the active link for /admin (dashboard)', () => {
        render(<AdminSidebar />)
        const activeLink = screen.getByText('Tổng quan').closest('a')
        expect(activeLink).toHaveClass('bg-indigo-600')
    })

    it('non-active links do not have bg-indigo-600', () => {
        render(<AdminSidebar />)
        const monHocLink = screen.getByText('Môn học').closest('a')
        expect(monHocLink).not.toHaveClass('bg-indigo-600')
    })

    it('has correct hrefs for all nav items', () => {
        render(<AdminSidebar />)
        expect(screen.getByText('Môn học').closest('a')).toHaveAttribute('href', '/admin/subjects')
        expect(screen.getByText('Bài học').closest('a')).toHaveAttribute('href', '/admin/lessons')
        expect(screen.getByText('Quiz').closest('a')).toHaveAttribute('href', '/admin/quizzes')
    })
})
