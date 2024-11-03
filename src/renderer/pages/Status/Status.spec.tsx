import {render, screen} from '@testing-library/react'
import Status from './Status.tsx'

describe('status page component', () => {
  it('should render with success', () => {
    render(<Status />)

    expect(
      screen.getByRole('heading', {
        name: 'Status',
        level: 1,
      }),
    ).toBeInTheDocument()
  })
})
