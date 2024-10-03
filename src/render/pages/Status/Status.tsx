import { Link as ReactRouterLink } from 'react-router-dom'
import { Link as ChakraLink, LinkProps } from '@chakra-ui/react'

function Status() {
  return (
    <div>
      <h1>Status page</h1>

      GO
      <ChakraLink as={ReactRouterLink} to='/'>
      Home
    </ChakraLink>
    </div>
  )
}

export default Status
