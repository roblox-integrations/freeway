import os from 'node:os'

export const REDIRECT_URI = 'http://localhost:3000/oauth/callback'
export const KEYTAR_SERVICE = 'roblox-integration-hub'
export const KEYTAR_ACCOUNT = os.userInfo().username
