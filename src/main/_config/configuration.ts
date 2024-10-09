import {CorsOptions} from '@nestjs/common/interfaces/external/cors-options.interface'

export function configuration() {
  return {
    port: Number.parseInt(process.env.PORT, 10) || 3000,
    roblox: {
      clientId: '3542170589549758275',
    },
    piece: {
      output: 'metadata.json',
    },
    cors: {
      "origin": "*",
      "methods": "*",
      "preflightContinue": false,
      "optionsSuccessStatus": 204
    }

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
}

export interface ConfigurationCors extends CorsOptions {
}

export interface Configuration {
  port: number,
  roblox: ConfigurationRoblox,
  cors: ConfigurationCors
}
