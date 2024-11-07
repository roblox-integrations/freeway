import {Button, Card, CardBody, CardFooter, Code, Flex, FormLabel, Heading, Image, Stack, Switch, Text} from '@chakra-ui/react'
import {useState} from 'react'

function PieceItemCurrentAssetId({item}) {
  const found = item?.uploads?.find(x => x.fileHash === item.fileHash)

  if (!found) {
    return null
  }

  return (
    <>
      assetId=
      {found.assetId}
    </>
  )
}

function PieceItemDate({date}) {
  const result = (new Date(date * 1000)).toISOString().slice(0, 19)
  return <>{result}</>
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

  const onCreateAsset = async () => {
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
    <Card
      size="sm"
      direction={{base: 'column', sm: 'row'}}
      overflow="hidden"
      variant="outline"
    >
      <Image
        objectFit="cover"
        maxW={{base: '100%', sm: '100px'}}
        src={`http://localhost:3000/api/pieces/${item.id}/preview`}
        alt="Caffe Latte"
      />

      <Stack>
        <CardBody>
          <Flex gap="2" my="2">
            <Code colorScheme="blue">{item.role}</Code>
            <Code colorScheme="green">{item.type}</Code>
            <Code colorScheme="gray">
              #
              {item.id}
            </Code>
            <Code colorScheme="gray"><PieceItemDate date={item.updatedAt}></PieceItemDate></Code>
          </Flex>
          <Heading size="xs">{item.filePath}</Heading>
          <Text>
            hash:
            {' '}
            {item.fileHash}
          </Text>
          <Text>
            uploads=
            {item.uploads.length}
            {' '}
            <PieceItemCurrentAssetId item={item}></PieceItemCurrentAssetId>
          </Text>

        </CardBody>

        <CardFooter gap="2" alignItems="center">
          <FormLabel mb="0" alignItems="center">
            <Switch isChecked={isAutoSave} onChange={onChangeIsAutoSave} />
            {' '}
            auto save
          </FormLabel>

          <Button variant="outline" colorScheme="blue" size="sm" onClick={onReveal}>
            Show in explorer (finder)
          </Button>

          <Button variant="outline" colorScheme="blue" size="sm" onClick={onCreateAsset}>
            Create Asset
          </Button>

          <Button variant="outline" colorScheme="red" size="sm" onClick={onDelete}>
            Delete
          </Button>

        </CardFooter>
      </Stack>
    </Card>
  )
}
