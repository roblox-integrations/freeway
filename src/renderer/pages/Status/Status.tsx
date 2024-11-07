import {Box, Button, Heading} from '@chakra-ui/react'

function Status() {
  async function onClick() {
    // window.electron.beep()
    window.electronApi.ipcRenderer.send('app:beep')
  }

  return (
    <Box p={4}>
      <Heading size="2xl">Status page</Heading>
      <br />
      <Button variant="outline" onClick={onClick}>Beep</Button>
    </Box>
  )
}

export default Status
