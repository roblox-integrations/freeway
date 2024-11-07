import {Box, Stack} from '@chakra-ui/react'
import {useEffect, useState} from 'react'
import {useCustomEventListener} from 'react-custom-events'
import PieceItem from './PieceItem'

function Pieces() {
  const [list, setList] = useState([])

  const getApiPieces = async () => {
    const res = await fetch('http://localhost:3000/api/pieces')
    const json = await res.json()
    setList(json)
  }

  useCustomEventListener<any>('piece:updated', () => {
    getApiPieces()
  })
  useCustomEventListener<any>('piece:created', () => {
    getApiPieces()
  })
  useCustomEventListener<any>('piece:deleted', () => {
    getApiPieces()
  })

  useEffect(() => {
    getApiPieces()
  }, [])

  return (
    <Box p={4}>
      <Stack gap="2">
        {list?.map(item => (
          <PieceItem
            key={item.filePath}
            item={item}
          />
        ))}
      </Stack>
    </Box>
  )
}

export default Pieces
