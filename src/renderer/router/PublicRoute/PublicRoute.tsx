import {ErrorState, Loader} from '@render/components'
import {useSession} from '@render/hooks'
import {ReactNode, Suspense} from 'react'
import {ErrorBoundary} from 'react-error-boundary'
import {Navigate} from 'react-router-dom'

interface Props {
  children: ReactNode
}

function PublicRoute(props: Props) {
  const {children} = props

/*
  const {isAuthenticated} = useSession()

  if (isAuthenticated) {
    return <Navigate to="/" />
  }
*/

  return (
    <ErrorBoundary
      fallback={<ErrorState text="An error occurred in the application." />}
    >
      <Suspense fallback={<Loader />}>{children}</Suspense>
    </ErrorBoundary>
  )
}

export default PublicRoute
