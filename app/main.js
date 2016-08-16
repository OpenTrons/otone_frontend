if (require('electron-squirrel-startup')) return;
const $ = jQuery = require('jquery')
const http       = require('http')
, CLogger  = require('node-clogger')
const path = require('path')
const nightlife  = require('nightlife-rabbit')
    , autobahn = require('autobahn')
const child_process = require('child_process')
const electron = require('electron')
const {app, powerSaveBlocker, BrowserWindow} = electron

function handleSquirrelEvent() {
  if (process.argv.length === 1 && process.platform != "win32") {
    return false;
  }
  const spawn = function(command, args) {
    let spawnedProcess, error;

    try {
      spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
    } catch (error) {}

    return spawnedProcess;
  };
  
  const spawnUpdate = function(args) {
    return spawn(updateDotExe, args);
  };
  
  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      // Optionally do things such as:
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //   explorer context menus

      // Install desktop and start menu shortcuts
      spawnUpdate(['--createShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-uninstall':
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers

      // Remove desktop and start menu shortcuts
      spawnUpdate(['--removeShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;
  }
};

const addMenu = require('./menu').addMenu;
const initAutoUpdater = require('./update_helpers').initAutoUpdater;


const winston = require('winston')

let backendProcess = undefined
let powerSaverID = undefined

require('electron-debug')({showDevTools: true, enabled: true});

if (process.env.NODE_ENV == 'development'){
    require('electron-debug')({showDevTools: true});
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  mainWindow = new BrowserWindow({width: 1200, height: 900})
  mainWindow.loadURL("file://" + __dirname + "/src/index.html")

  mainWindow.on('closed', function () {
    mainWindow = null
    app.quit();
  })
}

function startWampRouter() {

    var wamp_logger = new (winston.Logger)({
        transports: [
            new (winston.transports.File)({
                level: 'verbose',
                name: 'wamp-router',
                filename: app.getPath('userData') + '/otone_data/router_logfile.txt',
                json: false,
                maxsize: 10*1024*1024,
                maxFiles: 5,
                timestamp: function(){
                  const d = new Date();
                  return d.toISOString();
                }
            })
        ]
    });

    var router = nightlife.createRouter({
        httpServer: http.createServer(),
        port: 31947,
        path: '/ws',
        autoCreateRealms: true,
        logger: wamp_logger
    });
}

/**
 * Starts an executable in a separate process
 * @param {param} filePath - path to an executable
 * @param {Array} extraArgs - Array of arguments to pass during invocation of file
 */
function execFile(filePath, extraArgs) {
    backendProcess = child_process.execFile(filePath, extraArgs, {stdio: 'ignore' }, function(error, stdout, stderr){
        console.log(stdout);
        console.log(stderr);
        if (error) {
            throw error;
        }
    });

    var backendProcessName = path.basename(backendProcess.spawnfile)
    console.log(
        'Backend process successfully started with PID', backendProcess.pid,
        'and using spawnfile', backendProcessName
    )

    backendProcess.shutdown = function (){
        if (process.platform == "darwin") {
            child_process.spawnSync('pkill', ['-9', backendProcessName]);
        }
        else if (process.platform == "win32") {
            child_process.spawnSync('taskkill', ['/T', '/F',  '/IM', backendProcessName]);
        }
        console.log('Backend process successfully shutdown')
    }
}

/**
 * Starts otone_client backend executable; kills existing process if any
 */
function startBackend() {
    const userDataPath = app.getPath('userData');

    if (process.platform == "darwin") {
      var backend_path = app.getAppPath() + "/backend-dist/mac/otone_client";
      execFile(backend_path, [userDataPath]);
    }

    else if (process.platform == "win32") {
      var backend_path = app.getAppPath() + "\\backend-dist\\win\\otone_client.exe";
      execFile(backend_path, [userDataPath]);
    }
    else{
      console.log('\n\n\n\nunknown OS: '+process.platform+'\n\n\n\n');
    }
}

function blockPowerSaver() {
  powerSaverID = powerSaveBlocker.start('prevent-display-sleep')
}

app.on('ready', createWindow)
app.on('ready', startWampRouter)
app.on('ready', startBackend)
app.on('ready', addMenu)
app.on('ready', blockPowerSaver)
app.on('ready', initAutoUpdater)

app.on('window-all-closed', function () {
    app.quit()
})

app.on('quit', function(){
    process.once("uncaughtException", function (error) {
      // Ugly but convenient. If we have more than one uncaught exception
      // then re-raise. Otherwise Do nothing as that exception is caused by
      // an attempt to shutdown the backend process
      if (process.listeners("uncaughtException").length > 1) {
          throw error;
      }
    });
    backendProcess.shutdown();
    if (powerSaveBlocker.isStarted(powerSaverID)) {
      powerSaveBlocker.stop(powerSaverID);
    }
});
