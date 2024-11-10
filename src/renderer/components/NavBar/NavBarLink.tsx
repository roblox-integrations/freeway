import {Link} from '@chakra-ui/react'
import {ReactNode} from 'react'
import {NavLink} from 'react-router-dom'

export default function NavBarLink(props: {children: ReactNode, href: string}) {
  const {children, href} = props
  return (
    <Link
      asChild
      px={2}
      py={1}
      rounded="md"
      bg={{base: 'colorPalette.100', _dark: 'colorPalette.800'}}
      _currentPage={{
        bg: {base: 'colorPalette.200', _dark: 'colorPalette.900'},
      }}
      _hover={{
        bg: {base: 'colorPalette.200', _dark: 'colorPalette.900'},
        textDecoration: 'none',
      }}
      outline="none"
    >
      <NavLink to={href}>
        {children}
      </NavLink>
    </Link>
  )
}
