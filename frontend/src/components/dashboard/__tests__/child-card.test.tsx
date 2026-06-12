import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChildCard } from '@/components/dashboard/child-card'

describe('ChildCard', () => {
  it('renders child name correctly', () => {
    render(<ChildCard id="1" name="Test Child" />)
    expect(screen.getByText('Test Child')).toBeInTheDocument()
  })

  it('renders correctly with default props', () => {
    render(<ChildCard id="1" name="Test Child" />)
    expect(screen.getByText(/Lớp 1/i)).toBeInTheDocument()
    expect(screen.getByText('Chưa học hôm nay')).toBeInTheDocument()
  })
})

