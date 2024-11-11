import {IconButton} from '@chakra-ui/react'

export default function PieceItemButton({title, children, ...rest}) {
  return (
    <IconButton
      title={title}
      variant="ghost"
      rounded="full"
      color={{base: 'colorPalette.500', _hover: 'colorPalette.500'}}
      size="sm"
      {...rest}
    >
      {children}
    </IconButton>
  )
}
