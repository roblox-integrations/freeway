import {render, screen} from '@testing-library/react'
import Loader from './Loader'

describe('loader | component | unit test', () => {
  it('should render with success', () => {
    render(<Loader />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})
