import {contextBridge, ipcRenderer} from 'electron'

contextBridge.exposeInMainWorld(
  'electron',
  {
    reveal: (path: string): void => ipcRenderer.send('reveal', path),

    login: (): void => ipcRenderer.send('auth:login'),
    logout: (): void => ipcRenderer.send('auth:logout'),
    openExternal: (url: string): void => ipcRenderer.send('open:external', url),
    getAccount: (): Promise<string> => ipcRenderer.invoke('profile'),

    sendMsg: (msg: string): Promise<string> => ipcRenderer.invoke('msg', msg),
    onReplyMsg: (cb: (msg: string) => any) => ipcRenderer.on('reply-msg', (_, msg: string) => {
      cb(msg)
    }),

    onIpcMessage: (cb: (event: {name: string, data: any}) => any) => ipcRenderer.on('ipc-message', (_, event: {name: string, data: any}) => {
      cb(event)
    }),

  },
)
