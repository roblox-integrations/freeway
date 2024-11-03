import {Link as ChakraLink} from '@chakra-ui/react'
import {Link as ReactRouterLink} from 'react-router-dom'

function Status() {
  return (
    <div>
      <h1>Status page</h1>

      GO
      <ChakraLink as={ReactRouterLink} to="/">
        Home
      </ChakraLink>
    </div>
  )
}

export default Status
