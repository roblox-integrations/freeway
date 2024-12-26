import {Box, Image} from '@chakra-ui/react'

export default function PieceItemImage({item}) {
  if (item.role === 'virtual') {
    return (
      <Box
        objectFit="cover"
        maxW="120px"
        w="120px"
        maxH="80px"
        flex="0 0 120px"
        display="flex"
        background="gray.100"
        alignItems="center"
        justifyContent="center"
        font=""
      >
        virtual
      </Box>
    )
  }

  if (item.type === 'mesh') {
    return (
      <Box
        objectFit="cover"
        maxW="120px"
        w="120px"
        maxH="80px"
        flex="0 0 120px"
        display="flex"
        background="gray.100"
        alignItems="center"
        justifyContent="center"
        font=""
      >
        mesh
      </Box>
    )
  }

  return (
    <Image
      objectFit="cover"
      maxW="120px"
      w="120px"
      maxH="80px"
      flex="0 0 120px"
      src={`http://localhost:3000/api/pieces/${item.id}/preview?${item.hash}`}
      alt={item.name}
    />
  )
}
