import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChildCard } from '@/components/dashboard/child-card'

describe('ChildCard', () => {
  it('renders child name correctly', () => {
    render(<ChildCard name="Test Child" />)
    expect(screen.getByText('Test Child')).toBeInTheDocument()
  })

  it('displays child email when provided', () => {
    render(<ChildCard name="Test Child" email="test@example.com" />)
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('renders without email', () => {
    render(<ChildCard name="Test Child" />)
    expect(screen.queryByText('@')).not.toBeInTheDocument()
  })
})
