import {AuthContext} from '@render/contexts'
import {useContext} from 'react'

function useSession() {
  return useContext(AuthContext)
}

export default useSession
