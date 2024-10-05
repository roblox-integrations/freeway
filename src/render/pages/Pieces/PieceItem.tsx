import {Image, Card, Stack, CardBody, Heading, CardFooter, Button, Text} from '@chakra-ui/react'

export default function PieceItem({item}) {
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
          <Heading size='sm'>{item.filePath}</Heading>
          <Text py='2'>
            id {item.id} <br/>
            role {item.role} <br/>
            type {item.type} <br/>
            hash: {item.fileHash} <br/>
            updated: {item.updatedAt}
          </Text>
        </CardBody>

        <CardFooter>
          <Button variant='outline' colorScheme='blue' size='sm'>
            Action
          </Button>
        </CardFooter>
      </Stack>
    </Card>
  )
}
