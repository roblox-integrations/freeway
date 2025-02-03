import PieceItemUpload from '@/pages/Pieces/PieceItem/PieceItemUpload'

import {Box, Card, Code, Flex, Heading, HStack} from '@chakra-ui/react'
import {MdOutlineDelete as MdDelete, MdOutlineFolder as MdFolder} from 'react-icons/md'
import ConfirmPopover from '../../../components/ConfirmPopover/ConfirmPopover'
import PieceItemButton from './PieceItemButton'
import PieceItemCurrentAssetId from './PieceItemCurrentAssetId'
import PieceItemDate from './PieceItemDate'
import PieceItemImage from './PieceItemImage'
import PieceItemRole from './PieceItemRole'
import PieceItemStatus from './PieceItemStatus'

export default function PieceItem({item}) {
  function onReveal() {
    const path = `${item.dir}/${item.name}`
    window.electron.reveal(path)
  }

  const deletePieceItem = async () => {
    const res = await fetch(`http://localhost:3000/api/pieces/${item.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const json = await res.json()
    console.log('[PieceItem] deleted', json)
  }

  const onConfirmDelete = async () => {
    await deletePieceItem()
  }

  return (
    <Card.Root
      flexDirection="row"
      overflow="hidden"
      size="sm"
      variant="outline"
    >
      <PieceItemImage item={item}></PieceItemImage>
      <Box
        flex="1 0 0%"
        minW="calc(100% - 120px - 124px);"
      >
        <Card.Body p="2">
          <Heading size="xs">{item.name}</Heading>
          <Flex gap=".25rem .5rem" flexWrap="wrap" mt={2}>
            <Code colorPalette="gray" variant="surface">
              #
              {item.id}
            </Code>
            <Code colorPalette="green">{item.type}</Code>
            <PieceItemDate date={item.updatedAt}></PieceItemDate>
            <PieceItemCurrentAssetId item={item}></PieceItemCurrentAssetId>
            <PieceItemRole item={item}></PieceItemRole>
            <PieceItemStatus item={item}></PieceItemStatus>
          </Flex>
          {/*
          <Text>hash: {item.hash}</Text>
          <Text>uploads= {item.uploads.length} <PieceItemCurrentAssetId item={item}></PieceItemCurrentAssetId></Text>
*/}
        </Card.Body>
        <Card.Footer gap="2" alignItems="center">

        </Card.Footer>
      </Box>
      <Box
        p="2"
        w="124px"
        maxW="124px"
        flex="0 0 124px"
      >
        <HStack justifyContent="end" gap="0">
          <PieceItemUpload item={item} />
          <PieceItemButton onClick={onReveal} title="Reveal in Explorer">
            <MdFolder></MdFolder>
          </PieceItemButton>
          <ConfirmPopover onConfirm={onConfirmDelete}>
            <PieceItemButton title="Delete">
              <MdDelete></MdDelete>
            </PieceItemButton>
          </ConfirmPopover>
        </HStack>
      </Box>
    </Card.Root>
  )
}
