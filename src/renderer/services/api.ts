import axios from 'axios'

import {setupInterceptors} from './interceptors'

export const api = setupInterceptors(
  axios.create({
    baseURL: 'http://127.0.0.1:3000', // TODO: baseurl
  }),
)
