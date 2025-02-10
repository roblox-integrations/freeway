'use client'

import {
  ChakraProvider,
  createSystem,
  defaultConfig,
  defineConfig,
} from '@chakra-ui/react'

import {
  ColorModeProvider,
  type ColorModeProviderProps,
} from './color-mode'

const config = defineConfig({
  globalCss: {
    '*': {
      focusRingStyle: 'none',
      focusRing: 'none',
    },
  },
})

const system = createSystem(defaultConfig, config)

export function Provider(props: ColorModeProviderProps) {
  console.log('provider')
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider {...props} />
    </ChakraProvider>
  )
}
