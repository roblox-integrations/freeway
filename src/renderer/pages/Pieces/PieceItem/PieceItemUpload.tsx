import {Field} from '@/components/ui/field'
import {
  HoverCardArrow,
  HoverCardContent,
  HoverCardRoot,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import {Switch} from '@/components/ui/switch'
import {useSession} from '@/hooks'
import {Box, Kbd, Text} from '@chakra-ui/react'
import {MouseEvent, useState} from 'react'
import {MdUpload} from 'react-icons/md'
import PieceItemButton from './PieceItemButton'

export default function PieceItemUpload({item}) {
  const [isAutoUpload, setIsAutoUpload] = useState(item.isAutoUpload)

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

  async function onChangeIsAutoUpload() {
    const newIsAutoUpload = !isAutoUpload
    setIsAutoUpload(newIsAutoUpload)
    await updatePieceItem({isAutoUpload: newIsAutoUpload})
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

  const {isAuthenticated} = useSession()
  if (!isAuthenticated) {
    return null
  }

  return (
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

  )
}
