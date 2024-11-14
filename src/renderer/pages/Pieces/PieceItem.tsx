import {Field} from '@/components/ui/field'
import {Switch} from '@/components/ui/switch'
import {Box, Card, Code, Flex, Heading, Image, Stack} from '@chakra-ui/react'

import {useState} from 'react'
import {MdOutlineDelete as MdDelete, MdOutlineFolder as MdFolder, MdUpload} from 'react-icons/md'
import ConfirmPopover from '../../components/ConfirmPopover/ConfirmPopover'
import PieceItemButton from './PieceItemButton'
import PieceItemCurrentAssetId from './PieceItemCurrentAssetId'
import PieceItemDate from './PieceItemDate'

export default function PieceItem({item}) {
  const [isAutoSave, setIsAutoSave] = useState(item.isAutoSave)

  function onReveal() {
    window.electron.reveal(item.filePath)
  }

  const updatePieceItem = async ({isAutoSave}) => {
    console.log('[PieceItem] before', isAutoSave)

    const res = await fetch(`http://localhost:3000/api/pieces/${item.id}`, {
      method: 'PATCH',
      body: JSON.stringify({isAutoSave}),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const json = await res.json()
    console.log('[PieceItem] updated', json)
  }

  const deletePieceItem = async () => {
    console.log('[PieceItem] before', isAutoSave)

    const res = await fetch(`http://localhost:3000/api/pieces/${item.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const json = await res.json()
    console.log('[PieceItem] deleted', json)
  }

  const onUpload = async () => {
    const res = await fetch(`http://localhost:3000/api/pieces/${item.id}/asset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const json = await res.json()
    console.log('[PieceItem] asset', json)
  }

  const onConfirmDelete = async () => {
    await deletePieceItem()
  }

  async function onChangeIsAutoSave() {
    const newIsAutoSave = !isAutoSave
    setIsAutoSave(newIsAutoSave)
    await updatePieceItem({isAutoSave: newIsAutoSave})
  }

  return (
    <Card.Root
      flexDirection="row"
      overflow="hidden"
      size="sm"
      variant="outline"
    >
      <Image
        objectFit="cover"
        maxW="120px"
        w="120px"
        maxH="80px"
        flex="0 0 120px"
        src={`http://localhost:3000/api/pieces/${item.id}/preview?${item.fileHash}`}
        alt={item.name}
      />

      <Box
        flex="1 0 0%"
        minW="calc(100% - 120px - 124px);"
      >
        <Card.Body p="2">
          <Heading size="xs">{item.filePath}</Heading>
          <Flex gap=".25rem .5rem" flexWrap="wrap" mt={2}>
            <Code colorPalette="gray" variant="surface">
              #
              {item.id}
            </Code>
            <Code colorPalette="green">{item.type}</Code>
            <PieceItemDate date={item.updatedAt}></PieceItemDate>
            <PieceItemCurrentAssetId item={item}></PieceItemCurrentAssetId>
          </Flex>
          {/*
          <Text>hash: {item.fileHash}</Text>
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
        <Stack>
          <Box className="wtf">
            <PieceItemButton onClick={onUpload} title="Upload/Create Asset" colorPalette={item.isAutoSave ? 'green' : 'gray'}>
              <MdUpload></MdUpload>
            </PieceItemButton>
            <PieceItemButton onClick={onReveal} title="Reveal in Explorer">
              <MdFolder></MdFolder>
            </PieceItemButton>
            <ConfirmPopover onConfirm={onConfirmDelete}>
              <PieceItemButton title="Delete">
                <MdDelete></MdDelete>
              </PieceItemButton>
            </ConfirmPopover>
          </Box>
          <Box ml={2}>
            <Field>
              <Switch size="xs" colorPalette="green" checked={isAutoSave} onChange={onChangeIsAutoSave}>auto</Switch>
            </Field>
          </Box>
        </Stack>
      </Box>
    </Card.Root>
  )
}
