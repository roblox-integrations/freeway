import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld(
  'electron',
  {
    login: (): void => ipcRenderer.send('auth:login'),
    logout: (): void => ipcRenderer.send('auth:logout'),
    openExternal: (url: string): void => ipcRenderer.send('open:external', url),
    getAccount: (): Promise<string> => ipcRenderer.invoke('profile'),

    sendMsg: (msg: string): Promise<string> => ipcRenderer.invoke('msg', msg),
    onReplyMsg: (cb: (msg: string) => any) => ipcRenderer.on('reply-msg', (_, msg: string) => {
      cb(msg)
    }),
  },
)
