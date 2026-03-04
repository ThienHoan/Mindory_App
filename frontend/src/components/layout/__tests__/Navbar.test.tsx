import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import Navbar from '@/components/layout/Navbar'

// Mock Supabase client
const mockGetUser = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
}))

describe('Navbar', () => {
  beforeEach(() => {
    mockGetUser.mockClear()
  })

  it('renders navbar component', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    render(<Navbar />)
    await waitFor(() => {
      expect(screen.getByRole('banner')).toBeInTheDocument()
    })
  })

  it('displays greeting when user is logged in', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: '1',
          user_metadata: { full_name: 'Test User' },
        },
      },
      error: null,
    })

    render(<Navbar />)
    await waitFor(() => {
      expect(screen.getByText(/Xin chào/i)).toBeInTheDocument()
      expect(screen.getByText(/Test User/i)).toBeInTheDocument()
    })
  })
})
