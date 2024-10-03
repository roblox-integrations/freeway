export function configuration() {
  return {
    port: Number.parseInt(process.env.PORT, 10) || 3000,
    roblox: {
      clientId: '3542170589549758275',
    },
    piece: {
      output: 'metadata.json',
    },
    /*
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432
  }
*/
  }
}
