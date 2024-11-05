import {CloseIcon, HamburgerIcon} from '@chakra-ui/icons'
import {
  Avatar,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Link,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Stack,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react'

import {useRoutePaths, useSession} from '@render/hooks'

import {ReactNode} from 'react'
import {NavLink as RNavLink} from 'react-router-dom'
import {CanAccess} from '../CanAccess'

/* interface Props {
  children: React.ReactNode
} */

const Links = ['Home', 'Status', 'Pieces']

function NavLink(props: {children: ReactNode, href: string}) {
  const {children, href} = props

  return (
    <Link
      as={RNavLink}
      px={2}
      py={1}
      rounded="md"
      _hover={{
        textDecoration: 'none',
        bg: useColorModeValue('gray.200', 'gray.700'),
      }}

      _activeLink={{
        bg: useColorModeValue('gray.200', 'gray.700'),
      }}

      to={href}
    >
      {children}
    </Link>
  )
}

export default function Simple() {
  const {isAuthenticated, user, signOut, signIn} = useSession()
  const {LOGIN_PATH, STATUS_PATH, REGISTER_PATH, ROOT_PATH, PIECES_PATH} = useRoutePaths()

  function onClickRobloxAccount() {
    window.electron.openExternal(user.profile)
  }

  const {isOpen, onOpen, onClose} = useDisclosure()

  return (
    <>
      <Box bg={useColorModeValue('gray.100', 'gray.900')} px={4}>
        <Flex h={12} alignItems="center" justifyContent="space-between">
          <IconButton
            size="md"
            icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
            aria-label="Open Menu"
            display={{md: 'none'}}
            onClick={isOpen ? onClose : onOpen}
          />
          <HStack spacing={6} alignItems="center">
            <Box>Logo</Box>
            <HStack as="nav" spacing={4} display={{base: 'none', md: 'flex'}}>
              <NavLink href={ROOT_PATH}>Home</NavLink>
              <NavLink href={STATUS_PATH}>Status</NavLink>
              <NavLink href={PIECES_PATH}>Pieces</NavLink>
            </HStack>
          </HStack>
          {isAuthenticated && (
            <Flex alignItems="center">
              <Menu>
                <MenuButton
                  as={Button}
                  rounded="full"
                  variant="link"
                  cursor="pointer"
                  minW={0}
                >
                  <Avatar
                    size="sm"
                    src={user?.picture}
                  />
                </MenuButton>
                <MenuList>
                  <MenuItem _activeLink={user.profile} onClick={onClickRobloxAccount}>Roblox Account →</MenuItem>
                  <MenuItem>Settings</MenuItem>
                  <MenuDivider />
                  <MenuItem onClick={signOut}>Sign out</MenuItem>
                </MenuList>
              </Menu>
            </Flex>
          )}
        </Flex>
        <CanAccess>
          {isAuthenticated && isOpen
            ? (
                <Box pb={4} display={{md: 'none'}}>
                  <Stack as="nav" spacing={4}>
                    {Links.map(link => (
                      <NavLink key={link}>{link}</NavLink>
                    ))}
                  </Stack>
                </Box>
              )
            : null}
        </CanAccess>
      </Box>
    </>
  )
}
