const { app, dialog } = require('electron')

app.whenReady().then(() => {
  dialog.showMessageBox({ message: 'Hello World!' }).then(() => {
    app.quit()
  })
})
