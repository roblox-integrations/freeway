import { useContext } from 'react'
import { AuthContext } from '@render/contexts'

function useSession() {
  return useContext(AuthContext)
}

export default useSession
