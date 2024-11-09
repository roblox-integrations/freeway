import {Box, Flex, Heading, Stack, Text} from '@chakra-ui/react'
import {Button} from '@/components/ui/button'
import {useSession} from '@render/hooks'

import React, {useState} from 'react'

export default function Login() {
  const {signIn} = useSession()
  const [isLoading, setIsLoading] = useState<boolean>(false)

  async function onClick(ev: React.MouseEvent<HTMLButtonElement>) {
    setIsLoading(true)
    ev.preventDefault()
    await signIn()
  }

  return (
    <Flex minH="100vh" align="center" justify="center" bg='gray.50'>
      <Stack gap={8} mx="auto" maxW="lg" py={12} px={6}>
        <Stack align="center">
          <Heading fontSize="4xl">
            Sign in to your
            <br />
            Roblox account
          </Heading>
        </Stack>
        <Box rounded="lg" bg='white' boxShadow="lg" p={8}>
          <Stack gap={4}>
            <Stack>
              <Stack direction={{base: 'column', sm: 'row'}} align="start" justify="space-between">
                <Text>This will redirect you to the Roblox website to sign in</Text>
              </Stack>
              <Button onClick={onClick} loading={isLoading} loadingText="Redirecting →" colorPalette="blue" >
                Let's go →
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Flex>
  )
}
