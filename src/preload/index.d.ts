declare global {
  interface Window {
    electron: {
      login: () => void
      logout: () => void
      openExternal: (url: string) => void
      reveal: (path) => void
      getAccount: () => Promise<object>
      sendMsg: (msg: string) => Promise<string>
      onReplyMsg: (cb: (msg: string) => any) => void
    }
  }
}

export { }
