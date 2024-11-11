import {Code} from '@chakra-ui/react'

export default function PieceItemDate({date}) {
  const result = (new Date(date * 1000)).toISOString().slice(0, 19)
  return <Code colorPalette="gray">{result}</Code>
}
