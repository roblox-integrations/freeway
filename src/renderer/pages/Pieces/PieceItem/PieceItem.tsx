import {Field} from '@/components/ui/field'
import {
  HoverCardArrow,
  HoverCardContent,
  HoverCardRoot,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import {Switch} from '@/components/ui/switch'
import {Box, Card, Code, Flex, Heading, Kbd, Stack, Text} from '@chakra-ui/react'
import {MouseEvent, useState} from 'react'

import {MdOutlineDelete as MdDelete, MdOutlineFolder as MdFolder, MdUpload} from 'react-icons/md'
import ConfirmPopover from '../../../components/ConfirmPopover/ConfirmPopover'
import PieceItemButton from './PieceItemButton'
import PieceItemCurrentAssetId from './PieceItemCurrentAssetId'
import PieceItemDate from './PieceItemDate'
import PieceItemImage from './PieceItemImage'
import PieceItemRole from './PieceItemRole'
import PieceItemStatus from './PieceItemStatus'

export default function PieceItem({item}) {
  const [isAutoUpload, setIsAutoUpload] = useState(item.isAutoUpload)

  function onReveal() {
    window.electron.reveal(item.filePath)
  }

  const updatePieceItem = async ({isAutoUpload}) => {
    console.log('[PieceItem] before', isAutoUpload)

    const res = await fetch(`http://localhost:3000/api/pieces/${item.id}`, {
      method: 'PATCH',
      body: JSON.stringify({isAutoUpload}),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const json = await res.json()
    console.log('[PieceItem] updated', json)
  }

  const deletePieceItem = async () => {
    console.log('[PieceItem] before', isAutoUpload)

    const res = await fetch(`http://localhost:3000/api/pieces/${item.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const json = await res.json()
    console.log('[PieceItem] deleted', json)
  }

  const onUpload = async (ev: MouseEvent<HTMLElement>) => {
    if (ev.shiftKey) {
      onChangeIsAutoUpload()
      return
    }

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

  async function onChangeIsAutoUpload() {
    const newIsAutoUpload = !isAutoUpload
    setIsAutoUpload(newIsAutoUpload)
    await updatePieceItem({isAutoUpload: newIsAutoUpload})
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
        <Stack>
          <Box>
            <HoverCardRoot size="sm" lazyMount>
              <HoverCardTrigger asChild>
                <PieceItemButton onClick={onUpload} title="Upload/Create Asset" colorPalette={item.isAutoUpload ? 'green' : 'gray'}>
                  <MdUpload></MdUpload>
                </PieceItemButton>
              </HoverCardTrigger>
              <HoverCardContent maxWidth="240px">
                <HoverCardArrow />
                <Box>
                  <Field>
                    <Switch size="xs" colorPalette="green" checked={isAutoUpload} onChange={onChangeIsAutoUpload}>
                      auto-upload
                      {' '}
                      {isAutoUpload ? 'enabled' : 'disabled'}
                    </Switch>
                    <Text>
                      Automatically upload asset on change.
                      {' '}
                      <span>
                        <Kbd>shift</Kbd>
                        +
                        <Kbd>click</Kbd>
                      </span>
                    </Text>
                  </Field>
                </Box>
              </HoverCardContent>
            </HoverCardRoot>
            <PieceItemButton onClick={onReveal} title="Reveal in Explorer">
              <MdFolder></MdFolder>
            </PieceItemButton>
            <ConfirmPopover onConfirm={onConfirmDelete}>
              <PieceItemButton title="Delete">
                <MdDelete></MdDelete>
              </PieceItemButton>
            </ConfirmPopover>
          </Box>
        </Stack>
      </Box>
    </Card.Root>
  )
}
