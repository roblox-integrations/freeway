import {useSession} from '@render/hooks'
import {validateUserPermissions} from '@render/utils'
import {render, screen} from '@testing-library/react'
import CanAccess from './CanAccess'

jest.mock('@render/hooks/useSession', () => ({
  useSession: jest.fn(),
}))

jest.mock('@render/utils/validateUserPermissions', () => ({
  validateUserPermissions: jest.fn(),
}))

describe('canAccess component', () => {
  beforeEach(() => {
    ;(useSession as jest.Mock).mockReturnValue({
      isAuthenticated: true,
    })
  })

  describe('when the user does not have permission', () => {
    it('should not render child component', () => {
      ;(validateUserPermissions as jest.Mock).mockReturnValue({
        hasAllPermissions: false,
        hasAllRoles: false,
      })

      render(<CanAccess>Sample component</CanAccess>)

      expect(screen.queryByText('Sample component')).not.toBeInTheDocument()
    })
  })

  describe('when the user has permission', () => {
    it('should render child component', () => {
      ;(validateUserPermissions as jest.Mock).mockReturnValue({
        hasAllPermissions: true,
        hasAllRoles: true,
      })

      render(<CanAccess>Sample component</CanAccess>)

      expect(screen.getByText('Sample component')).toBeInTheDocument()
    })
  })
})
