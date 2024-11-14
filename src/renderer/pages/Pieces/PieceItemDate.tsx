import {Code} from '@chakra-ui/react'

export default function PieceItemDate({date}) {
  const result = (new Date(date * 1000)).toISOString().slice(0, 19).replace('T', ' ')
  return <Code colorPalette="gray" variant="outline">{result}</Code>
}
