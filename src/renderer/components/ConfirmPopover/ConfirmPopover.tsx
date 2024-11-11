'use client'

import {Button} from '@/components/ui/button'

import {
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverFooter,
  PopoverRoot,
  PopoverTrigger,
} from '@/components/ui/popover'
import {Popover as ChakraPopover, Group} from '@chakra-ui/react'

import {useRef} from 'react'

function noop() {}

function ConfirmPopover({
  onConfirm,
  onCancel = noop,
  confirmMessage = 'Are you sure?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  children,
}) {
  const ref = useRef<HTMLButtonElement>(null)
  return (
    <PopoverRoot initialFocusEl={() => ref.current} size="xs" lazyMount>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent w="12rem">
        <PopoverArrow />
        <PopoverBody>
          {confirmMessage}
        </PopoverBody>
        <PopoverFooter>
          <Group justifyContent="flex-end" width="100%">
            <ChakraPopover.CloseTrigger asChild>
              <Button size="xs" ref={ref} onClick={onCancel} variant="ghost">
                {cancelLabel}
              </Button>
            </ChakraPopover.CloseTrigger>
            <Button size="xs" onClick={onConfirm} colorPalette="red">
              {confirmLabel}
            </Button>
          </Group>
        </PopoverFooter>
      </PopoverContent>
    </PopoverRoot>
  )
}

export default ConfirmPopover
