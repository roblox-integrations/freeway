'use client'

import {
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverRoot,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import {Button, Link, Text} from '@chakra-ui/react'
import {useEffect, useState} from 'react'
import {useCustomEventListener} from 'react-custom-events'

export default function NavbarUpdateAvailable() {
  const [open, setOpen] = useState(false)
  const [isUpdateAvailable, setIsUpdateAvailable] = useState<boolean>(false)
  const [updateInfo, setUpdateInfo] = useState<any>(null)
  useCustomEventListener<any>('app:update-available', async (data) => {
    setIsUpdateAvailable(true)
    setUpdateInfo(data)
  })

  const getApiAppUpdateAvailable = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/app/update-info')
      const json = await res.json()

      if (json && json.isUpdateAvailable) {
        setIsUpdateAvailable(true)
        setUpdateInfo(json.updateInfo)
      }
    }
    catch (err: any) {
      console.error(err)
    }
  }

  useEffect(() => {
    getApiAppUpdateAvailable()
  }, [])

  if (!isUpdateAvailable) {
    return null
  }

  const uriReleases = `https://github.com/roblox-integrations/freeway/releases`
  const uriRelease = `${uriReleases}/tag/${updateInfo.tag}`

  return (
    <PopoverRoot open={open} onOpenChange={e => setOpen(e.open)} autoFocus={false}>
      <PopoverTrigger asChild>
        <Button size="xs" variant="outline" colorPalette="teal">
          Update available
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        <PopoverBody>
          <PopoverTitle fontWeight="medium">Update available</PopoverTitle>
          <Text mt={2}>
            <span>A </span>
            <Link variant="underline" href={uriRelease} target="_blank">new version {updateInfo.version}</Link>
            <span> is available.</span>
            <br />
            <span>Please </span>
            <Link variant="underline" href={uriReleases} target="_blank">download</Link>
            <span> and install the {updateInfo.version} version.</span>
          </Text>
        </PopoverBody>
      </PopoverContent>
    </PopoverRoot>
  )
}
