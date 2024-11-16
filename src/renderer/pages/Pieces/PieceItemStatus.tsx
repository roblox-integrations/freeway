import {Code} from '@chakra-ui/react'

export default function PieceItemStatus({item}) {
  if (item.status === 'ok') {
    return null
  }

  return (
    <Code colorPalette="white" variant="solid" position="absolute" left={0} top={0}>
      {item.status}
    </Code>
  )
}
