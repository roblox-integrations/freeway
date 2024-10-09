import {Box, Stack} from '@chakra-ui/react'
import { useEffect, useState } from "react";
import PieceItem from "@render/pages/Pieces/PieceItem.tsx";
import { useCustomEventListener } from 'react-custom-events'

function Pieces() {
  const getApiPieces = async () => {
    const res = await fetch("http://localhost:3000/api/pieces")
    const json = await res.json();
    setList(json);
  };

  useCustomEventListener<any>('piece:updated', () => {
    getApiPieces()
  })
  useCustomEventListener<any>('piece:created', () => {
    getApiPieces()
  })
  useCustomEventListener<any>('piece:deleted', () => {
    getApiPieces()
  })

  const [list, setList] = useState([]);
  useEffect(() => {
    getApiPieces();
  }, []);

  return (
    <Box p={4}>
      <Stack gap='2'>
        {list &&
          list.map((item) => (
            <PieceItem
              key={item.filePath}
              item={item}
            />
          ))
        }
      </Stack>
    </Box>
  )
}

export default Pieces
