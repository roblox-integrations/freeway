declare global {
  interface Window {
    // electron: ElectronAPI
    electron: {
      login: () => void
      logout: () => void
      openExternal: (url: string) => void
      reveal: (path) => void
      getAccount: () => Promise<object>
      sendMsg: (msg: string) => Promise<string>
      onReplyMsg: (cb: (msg: string) => any) => void
      onIpcMessage: (cb: (msg: {name: string, data: any}) => any) => void
    }
    api: {
      foo: () => void
    }
  }
}
