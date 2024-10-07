import {Image, Card, Stack, CardBody, Heading, CardFooter, Button, Text, Badge, Flex} from '@chakra-ui/react'

export default function PieceItem({item}) {
  function onReveal () {
    window.electron.reveal(item.filePath);
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
        src='https://images.unsplash.com/photo-1667489022797-ab608913feeb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxlZGl0b3JpYWwtZmVlZHw5fHx8ZW58MHx8fHw%3D&auto=format&fit=crop&w=800&q=60'
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
        </CardBody>

        <CardFooter gap='2'>
          <Button variant='outline' colorScheme='blue' size='sm'>
            Action
          </Button>

          <Button variant='outline' colorScheme='blue' size='sm' onClick={onReveal}>
            Show in explorer (finder)
          </Button>
        </CardFooter>
      </Stack>
    </Card>
  )
}
