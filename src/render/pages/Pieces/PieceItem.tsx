import {Image, Card, Stack, CardBody, Heading, CardFooter, Button, Text, Badge, Flex, Switch, FormLabel} from '@chakra-ui/react'
import {useState, useEffect} from "react";

function CurrentAssetId ({item}) {
  const found = item?.uploads?.find(x => x.fileHash === item.fileHash);

  if (!found) {
    return null
  }

  return <>assetId: {found.assetId}</>
}

export default function PieceItem({item}) {
  const [isAutoSave, setIsAutoSave] = useState(item.isAutoSave);

  function onReveal () {
    window.electron.reveal(item.filePath);
  }

  const updatePieceItem = async ({isAutoSave}) => {
    console.log('[PieceItem] before', isAutoSave)

    const res = await fetch(`http://localhost:3000/api/pieces/${item.id}`, {
      method: 'PATCH',
      body: JSON.stringify({isAutoSave}),
      headers: {
        'Content-Type': 'application/json',
      }
    })
    const json = await res.json();
    console.log('[PieceItem] updated', json)
  };

  const onCreateAsset = async () => {
    const res = await fetch(`http://localhost:3000/api/pieces/${item.id}/asset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    const json = await res.json();
    console.log('[PieceItem] asset', json)
  };

  async function onChangeIsAuthSave () {
    const newIsAutoSave = !isAutoSave;
    setIsAutoSave(newIsAutoSave);
    updatePieceItem({isAutoSave: newIsAutoSave});
  }

  return (
    <Card
      size='sm'
      direction={{base: 'column', sm: 'row'}}
      overflow='hidden'
      variant='outline'
    >
      <Image
        objectFit='cover'
        maxW={{base: '100%', sm: '100px'}}
        src={`http://localhost:3000/api/pieces/${item.id}/preview`}
        alt='Caffe Latte'
      />

      <Stack>
        <CardBody>
          <Flex gap='2' my='2'>
            <Badge colorScheme='blue'>{item.role}</Badge>
            <Badge colorScheme='green'>{item.type}</Badge>
          </Flex>
          <Heading size='sm'>{item.filePath}</Heading>
          <Text>
            id {item.id}
          </Text>
          <Text>
            hash: {item.fileHash}
          </Text>
          <Text>
            updated: {item.updatedAt}
          </Text>
          <Text>
            uploads: {item.uploads.length}, <CurrentAssetId item={item}></CurrentAssetId>
          </Text>

        </CardBody>

        <CardFooter gap='2' alignItems='center'>
          <FormLabel mb='0' alignItems='center'>
            <Switch isChecked={isAutoSave} onChange={onChangeIsAuthSave} /> auto save
          </FormLabel>

          <Button variant='outline' colorScheme='blue' size='sm' onClick={onReveal}>
            Show in explorer (finder)
          </Button>

          <Button variant='outline' colorScheme='blue' size='sm' onClick={onCreateAsset}>
            Create Asset
          </Button>

        </CardFooter>
      </Stack>
    </Card>
  )
}
