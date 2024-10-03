import { HashRouter } from 'react-router-dom'
import { NavBar } from './components'
import { AuthProvider } from './providers'
import { Router } from './router'
import {Avatar, Button, ChakraProvider, Flex, Menu, MenuButton, MenuDivider, MenuItem, MenuList} from "@chakra-ui/react";
import {useRoutePaths, useSession} from "@render/hooks";

function App() {
  const { isAuthenticated, user, signOut, signIn } = useSession()

  return (
    <ChakraProvider>
      <HashRouter>
        <AuthProvider>
          <Router />
        </AuthProvider>
      </HashRouter>
    </ChakraProvider>
  )
}

export default App
