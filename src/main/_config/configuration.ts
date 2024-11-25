import {join} from 'node:path'
import process from 'node:process'
import {CorsOptions} from '@nestjs/common/interfaces/external/cors-options.interface'
import {app} from 'electron'

export function configuration() {
  return {
    main: {
      port: Number.parseInt(process.env.PORT, 10) || 3000,
      host: 'localhost', // use '0.0.0.0' value, if you want to accept connections on other hosts than localhost
    },
    roblox: {
      clientId: '3542170589549758275',
      scope: 'openid profile asset:read asset:write',
    },
    piece: {
      output: 'metadata.json',
      watchDirectory: join(app.getPath('home'), 'roblox-electron-hub/files'),
      metadataPath: join(app.getPath('home'), 'roblox-electron-hub/metadata.json'),
      uploadQueue: {
        delay: 50,
        concurrency: 10,
        retries: 2,
      },
      watcherQueue: {
        delay: 200,
        concurrency: 20,
        retries: 2,
      },
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

export interface ConfigurationMain {
  port: number
  host: string
}

export interface ConfigurationPiece {
  output: string
  watchDirectory: string
  metadataPath: string
  uploadQueue: {
    delay: number
    concurrency: number
    retries: number
  }
  watcherQueue: {
    delay: number
    concurrency: number
    retries: number
  }
}

export interface ConfigurationCors extends CorsOptions {
}

export interface Configuration {
  main: ConfigurationMain
  roblox: ConfigurationRoblox
  cors: ConfigurationCors
  piece: ConfigurationPiece
}
