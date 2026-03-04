# Mindory App - Testing Guide

## 🧪 Chạy Tests

```bash
cd frontend

# Chạy tests một lần
pnpm test run

# Chạy tests ở watch mode
pnpm test

# Xem UI tests
pnpm test:ui

# Tạo coverage report
pnpm test:coverage
```

## 📝 Viết Tests

Tests được đặt trong thư mục `__tests__` cùng cấp với component:

```
src/components/
  dashboard/
    child-card.tsx
    __tests__/
      child-card.test.tsx
```

### Ví dụ test component:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MyComponent from '@/components/MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})
```

### Mock Supabase:

```typescript
const mockGetUser = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
}))

// Trong test:
mockGetUser.mockResolvedValue({
  data: { user: { id: '1', email: 'test@example.com' } },
  error: null,
})
```

## 🔧 Cấu hình

- **vitest.config.ts**: Cấu hình chính
- **src/test/setup.ts**: Setup global cho tests
- **.env.test**: Environment variables cho tests

## 🚀 CI/CD

Tests tự động chạy khi:
- Push code lên `main` hoặc `develop`
- Tạo Pull Request

Xem workflow tại `.github/workflows/ci.yml`
