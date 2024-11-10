import {Field} from '@/components/ui/field'
import {Switch} from '@/components/ui/switch'
import {Box, Card, Code, Flex, Heading, IconButton, Image, VStack} from '@chakra-ui/react'

import {useState} from 'react'
import {MdOutlineDelete as MdDelete, MdOutlineFolder as MdFolder, MdOutlineCloudUpload as MdUpload} from 'react-icons/md'

function PieceItemCurrentAssetId({item}) {
  const found = item?.uploads?.find(x => x.fileHash === item.fileHash)

  if (!found) {
    return null
  }

  return (
    <Code colorPalette="blue">
      rbxassetid://{found.assetId}
    </Code>
  )
}

function PieceItemDate({date}) {
  const result = (new Date(date * 1000)).toISOString().slice(0, 19)
  return <Code colorPalette="gray">{result}</Code>
}

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

  async function onChangeIsAutoSave() {
    const newIsAutoSave = !isAutoSave
    setIsAutoSave(newIsAutoSave)
    updatePieceItem({isAutoSave: newIsAutoSave})
  }

  async function onDelete() {
    await deletePieceItem()
  }

  return (
    <Card.Root
      flexDirection="row"
      overflow="hidden"
      size="sm"
      variant="outline"
      gap="1"
    >
      <Image
        objectFit="cover"
        maxW={{base: '100%', sm: '100px'}}
        src={`http://localhost:3000/api/pieces/${item.id}/preview?${item.fileHash}`}
        alt="Caffe Latte"
      />

      <Box flex="1 0 auto">
        <Card.Body p="2">
          <Flex gap="2" my="2">
            <Code colorPalette="gray" variant="surface">
              #
              {item.id}
            </Code>
            <Code colorPalette="green">{item.type}</Code>
            <PieceItemDate date={item.updatedAt}></PieceItemDate>
            <PieceItemCurrentAssetId item={item}></PieceItemCurrentAssetId>

          </Flex>
          <Heading size="xs">{item.filePath}</Heading>
          {/*
          <Text>hash: {item.fileHash}</Text>
          <Text>uploads= {item.uploads.length} <PieceItemCurrentAssetId item={item}></PieceItemCurrentAssetId></Text>
*/}
        </Card.Body>
        <Card.Footer gap="2" alignItems="center">

        </Card.Footer>
      </Box>
      <Box width="32" p="2">
        <VStack>
          <Box>
            <IconButton
              onClick={onUpload}
              title="Upload/Create Asset"
              variant="ghost"
              rounded="full"
              color={{base: 'colorPalette.500', _hover: 'colorPalette.500'}}
              size="sm"
            >
              <MdUpload></MdUpload>
            </IconButton>
            <IconButton
              onClick={onReveal}
              title="Reveal in explorer"
              variant="ghost"
              rounded="full"
              color={{base: 'colorPalette.500', _hover: 'colorPalette.500'}}
              size="sm"
            >
              <MdFolder></MdFolder>
            </IconButton>
            <IconButton
              onClick={onDelete}
              variant="ghost"
              rounded="full"
              color={{base: 'colorPalette.500', _hover: 'colorPalette.500'}}
              size="sm"
            >
              <MdDelete></MdDelete>
            </IconButton>
          </Box>
          <Box self-align="end">
            <Field>
              <Switch size="xs" colorPalette="green" checked={isAutoSave} onChange={onChangeIsAutoSave}>
                save
              </Switch>
            </Field>
          </Box>
        </VStack>
      </Box>
    </Card.Root>
  )
}
