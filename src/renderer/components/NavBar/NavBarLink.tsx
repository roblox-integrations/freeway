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
      _hover={{
        textDecoration: 'none',
        bg: 'gray.200',
      }}
      _currentPage={{
        bg: 'gray.200',
      }}
      outline="none"
    >
      <NavLink to={href}>
        {children}
      </NavLink>
    </Link>
  )
}
