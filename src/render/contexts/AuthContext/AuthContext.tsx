// import { AxiosError } from 'axios'
import { createContext } from 'react'

export type User = {
  name: string
  nickname: string
  preferred_username: string
  profile: string
  picture: string

  permissions: string[] // not in use
  roles: string[] // not in use
}

export type AuthContextData = {
  user?: User
  isAuthenticated: boolean
  loadingUserData: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext({} as AuthContextData)

export default AuthContext
