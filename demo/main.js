import { app, dialog } from 'electron'

app.whenReady().then(() => {
  dialog.showMessageBox({ message: 'Hello World!' }).then(() => {
    app.quit()
  })
})
