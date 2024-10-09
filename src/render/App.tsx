import { HashRouter } from 'react-router-dom'
import { AuthProvider } from './providers'
import { Router } from './router'
import {ChakraProvider} from "@chakra-ui/react";
// import {useRoutePaths, useSession} from "@render/hooks";
import { emitCustomEvent } from 'react-custom-events'

function App() {

  window.electron.onIpcMessage(message => {
    emitCustomEvent('message', message)
  });

  // const { isAuthenticated, user, signOut, signIn } = useSession()

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
