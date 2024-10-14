import {app, BrowserWindow, shell} from "electron";
import {IpcHandle, IpcOn, Window} from "@doubleshot/nest-electron";
import {Controller, Get} from "@nestjs/common";
import {Payload} from "@nestjs/microservices";
import {type Observable, of} from "rxjs";
import {AuthService} from "@main/auth/auth.service";
import {AppService} from "./app.service";
import {join} from "node:path";

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Window() private readonly mainWin: BrowserWindow,
    private readonly authService: AuthService
  ) {
    const webRequest = this.mainWin.webContents.session.webRequest;
    const filter = {urls: ["http://localhost:3000/oauth/callback*"]};

    webRequest.onBeforeRequest(filter, async ({url}) => {
      try {
        await this.authService.loadTokens(url);

        const isDev = !app.isPackaged

        const URL = isDev
          ? process.env.DS_RENDERER_URL
          : `file://${join(app.getAppPath(), "dist/render/index.html")}`;

        await this.mainWin.loadURL(URL);

      }
      catch (err) {
        this.mainWin.webContents.send("auth:err:load-tokens");
        // TODO: show error
        console.log(err.message);
        console.log(err.stack);
      }
    });

    this.mainWin.webContents.send("ipc-message", {name: 'ready'})
  }

  @IpcHandle("msg")
  public handleSendMsg(@Payload() msg: string): Observable<string> {
    this.mainWin.webContents.send("reply-msg", "this is msg from webContents.send");
    return of(`The main process received your message: ${msg} at time: ${this.appService.getTime()}`);
  }

  @IpcOn("auth:login")
  public handleAuthLogin() {
    this.mainWin.loadURL(this.authService.getAuthenticationURL());
  }

  @IpcOn("auth:logout")
  public handleAuthLogout() {
    this.authService.logout();
  }

  @IpcOn("open:external")
  public handleOpenExternal(url: string): void {
    shell.openExternal(url);
  }

  @IpcOn("reveal")
  public reveal(@Payload() path: string): void {
    shell.showItemInFolder(path);
  }

  @Get("/")
  public root() {
    return {message: "hello"};
  }
}
