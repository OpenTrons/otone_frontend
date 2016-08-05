const electron = require("electron");
const {app, autoUpdater} = electron;

var UPDATE_SERVER_URL =  'http://localhost:3000';


function initAutoUpdater () {
  autoUpdater.on(
    'error',
    (err) => console.log(`Update error: ${err.message}`)
  )

  autoUpdater.on(
    'checking-for-update',
    () => console.log('Checking for update')
  )

  autoUpdater.on(
    'update-available',
    () => console.log('Update available')
  )

  autoUpdater.on(
    'update-not-available',
    () => console.log('Update not available')
  )

  autoUpdater.on(
    'update-downloaded',
    (e, notes, name, date, url) => console.log(`Update downloaded: ${name}: ${url}`)
  )

  var AUTO_UPDATE_URL = UPDATE_SERVER_URL + '?version=' + app.getVersion()
  console.log('Setting AUTO UPDATE URL to ' + AUTO_UPDATE_URL)
  autoUpdater.setFeedURL(AUTO_UPDATE_URL)
  autoUpdater.checkForUpdates()
}


function okButtonHandler(buttonIndex) {
    console.log('ok button app...')
}

function updateButtonHandler(buttonIndex) {
    console.log('Updating app...')
}

let updateButtons = [
    ['Ok', okButtonHandler],
    ['Update', updateButtonHandler]
];


module.exports = {
    updateButtons,
    initAutoUpdater
};


