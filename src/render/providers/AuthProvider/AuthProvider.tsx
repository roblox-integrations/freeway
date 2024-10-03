import { ReactNode, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AuthContext, User } from '@render/contexts'
import { paths } from '@render/router'
// import { api, setAuthorizationHeader } from '@render/services'
// import { createSessionCookies, getToken, removeSessionCookies } from '@render/utils'

type Props = {
  children: ReactNode
}

function AuthProvider(props: Props) {
  const { children } = props

  const [user, setUser] = useState<User>()
  const [loadingUserData, setLoadingUserData] = useState(true)
  const navigate = useNavigate()
  // const { pathname } = useLocation()

  // const token = getToken()
  // const isAuthenticated = Boolean(token)
  const [isAuthenticated, setIdAuthenticated] = useState<boolean>(false)

  async function signIn() {
    console.log('[AuthProvider] signIn');
    window.electron.login()
  }

  async function signOut() {
    // removeSessionCookies()
    setUser(undefined)
    setLoadingUserData(false)
    setIdAuthenticated(false)
    navigate(paths.LOGIN_PATH)
    window.electron.logout()
  }

/*
  useEffect(() => {
    console.log('use effect');
    if (!token) {
      removeSessionCookies()
      setUser(undefined)
      setLoadingUserData(false)
    }
  }, [navigate, pathname, token])
*/

  useEffect(() => {
    async function getUserData() {
      setLoadingUserData(true)

      try {
        const account = await window.electron.getAccount() as User
        if (account) {
          setUser(account)
          console.log('[AuthProvider] getUserData()', account);
          setIdAuthenticated(true)
        }
        else {
          console.log('[AuthProvider] getUserData()', null  );
          setIdAuthenticated(false)
        }
      } catch (error) {
        console.error(error)
        setIdAuthenticated(false)
      } finally {
        setLoadingUserData(false)
      }
    }
    getUserData()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loadingUserData,
        signIn,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
