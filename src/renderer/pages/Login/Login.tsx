import {Box, Button, Flex, Heading, Stack, Text, useColorModeValue} from '@chakra-ui/react'
import {useSession} from '@render/hooks'

import React, {useState} from 'react'

export default function Login() {
  const {signIn} = useSession()
  const [isLoading, setIsLoading] = useState<boolean>(false)

  async function login(ev: React.MouseEvent<HTMLButtonElement>) {
    setIsLoading(true)
    ev.preventDefault()
    await signIn()
  }

  return (
    <Flex minH="100vh" align="center" justify="center" bg={useColorModeValue('gray.50', 'gray.800')}>

      <Stack spacing={8} mx="auto" maxW="lg" py={12} px={6}>
        <Stack align="center">
          <Heading fontSize="4xl">
            Sign in to your
            <br />
            Roblox account
          </Heading>
        </Stack>
        <Box rounded="lg" bg={useColorModeValue('white', 'gray.700')} boxShadow="lg" p={8}>
          <Stack spacing={4}>
            <Stack>
              <Stack direction={{base: 'column', sm: 'row'}} align="start" justify="space-between">
                <Text>This will redirect you to the Roblox website to sign in</Text>
              </Stack>
              <Button isLoading={isLoading} loadingText="Redirecting →" onClick={login} colorScheme="blue">
                Let's go →
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Flex>
  )
}
