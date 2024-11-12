import {join} from 'node:path'
import process from 'node:process'
import {CorsOptions} from '@nestjs/common/interfaces/external/cors-options.interface'
import {app} from 'electron'

export function configuration() {
  return {
    port: Number.parseInt(process.env.PORT, 10) || 3000,
    roblox: {
      clientId: '3542170589549758275',
      scope: 'openid profile asset:read asset:write',
    },
    piece: {
      output: 'metadata.json',
      watchDirectory: join(app.getPath('home'), 'roblox-electron-hub/files'),
      metadataPath: join(app.getPath('home'), 'roblox-electron-hub/metadata.json'),
    },
    cors: {
      origin: '*',
      methods: '*',
      preflightContinue: false,
      optionsSuccessStatus: 204,
    },

    /*
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432
  }
*/
  } as Configuration
}

export interface ConfigurationRoblox {
  clientId: string
  scope: string
}

export interface ConfigurationPiece {
  output: string
  watchDirectory: string
  metadataPath: string
}

export interface ConfigurationCors extends CorsOptions {
}

export interface Configuration {
  port: number
  roblox: ConfigurationRoblox
  cors: ConfigurationCors
  piece: ConfigurationPiece
}
