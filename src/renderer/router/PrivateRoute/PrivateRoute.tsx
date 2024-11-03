import {ErrorState, Loader} from '@render/components'
import {useSession} from '@render/hooks'
import {validateUserPermissions} from '@render/utils'
import {ReactNode, Suspense} from 'react'
import {ErrorBoundary} from 'react-error-boundary'
import {Navigate} from 'react-router-dom'

interface Props {
  permissions?: string[]
  roles?: string[]
  redirectTo?: string
  children: ReactNode
}

function PrivateRoute(props: Props) {
  const {permissions, roles, redirectTo = '/login', children} = props

  const {isAuthenticated, user, loadingUserData} = useSession()
  const {hasAllPermissions} = validateUserPermissions({
    user,
    permissions,
    roles,
  })

  if (loadingUserData) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} />
  }

  if (!hasAllPermissions) {
    return <Navigate to="/" />
  }

  return (
    <ErrorBoundary fallback={<ErrorState text="An error occurred in the application." />}>
      <Suspense fallback={<Loader />}>{children}</Suspense>
    </ErrorBoundary>
  )
}

export default PrivateRoute
