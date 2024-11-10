import {Provider} from '@/components/ui/provider'
import {ColorModeProvider} from '@/components/ui/color-mode'
import {HashRouter} from 'react-router-dom'
import {AuthProvider} from './providers'
import {Router} from './router'
// import {useRoutePaths, useSession} from "@render/hooks";
import {emitCustomEvent} from 'react-custom-events'

function App() {
  window.electron.onIpcMessage((message) => {
    emitCustomEvent(message.name || 'unknown-message', message.data)
  })

  // const { isAuthenticated, user, signOut, signIn } = useSession()

  return (
    <Provider>
      <ColorModeProvider>
        <HashRouter>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </HashRouter>
      </ColorModeProvider>
    </Provider>
  )
}

export default App
