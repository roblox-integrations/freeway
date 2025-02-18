import {Box} from '@chakra-ui/react'
import {useEffect, useState} from 'react'

interface TestData {
  date: string
  nodeVersion: string // Node.js version string
  appVersion: string // Application version string
  resourceDir: string // Directory path as a string
  studioLinksDir: string // Directory path as a string
  studioPluginsDir: string // Directory path as a string
}

function StatusData() {
  const [testData, setTestData] = useState<TestData | null>(null)

  async function getApiTest() {
    const res = await fetch(`http://localhost:3000/api/test`)
    const json = await res.json()
    setTestData(json)
  }

  useEffect(() => {
    getApiTest()
  }, [])

  if (!testData) {
    return null
  }

  return (
    <Box my={4}>
      Application version: {testData.appVersion}
      <br />
    </Box>
  )
}

export default StatusData
