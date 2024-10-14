import { ReactNode, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AuthContext, User } from '@render/contexts'
import { paths } from '@render/router'
import {useCustomEventListener} from "react-custom-events";
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

  async function signIn() {
    console.log('[AuthProvider] signIn');
    window.electron.login()
  }

  async function signOut() {
    // removeSessionCookies()
    setUser(undefined)
    setLoadingUserData(false)
    setIsAuthenticated(false)
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

  async function getUserData() {
    setLoadingUserData(true)

    try {
      const account = await window.electron.getAccount() as User
      if (account) {
        setUser(account)
        console.log('[AuthProvider] getUserData()', account);
        setIsAuthenticated(true)
      }
      else {
        console.log('[AuthProvider] getUserData()', null  );
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error(error)
      setIsAuthenticated(false)
    } finally {
      setLoadingUserData(false)
    }
  }


  useCustomEventListener<any>('ready', async () => {
    console.log('[AuthProvider] ready')
    await getUserData()
  })

  useEffect(() => {
    // getUserData()
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
