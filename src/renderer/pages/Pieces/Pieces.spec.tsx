import {render, screen} from '@testing-library/react'
import Pieces from './Pieces'

describe('pieces page component', () => {
  it('should render with success', () => {
    render(<Pieces />)

    expect(
      screen.getByRole('heading', {
        name: 'Pieces',
        level: 1,
      }),
    ).toBeInTheDocument()
  })
})
