const ROOT_PATH = '/'
const LOGIN_PATH = '/login'
const REGISTER_PATH = '/register'
const STATUS_PATH = '/status'
const PIECES_PATH = '/pieces'
const PIECE_PATH = '/pieces/:id'

const paths = {
  ROOT_PATH,
  LOGIN_PATH,
  REGISTER_PATH,
  STATUS_PATH,
  PIECES_PATH,
  PIECE_PATH,
} as const

export default paths
