import {Code} from '@chakra-ui/react'

export default function PieceItemRole({item}) {
  if (item.role !== 'virtual') {
    return null
  }

  return <Code colorPalette="orange" variant="outline">{item.role}</Code>
}
