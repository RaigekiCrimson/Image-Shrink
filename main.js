const path = require('path');
const os = require('os');
const {app, BrowserWindow, Menu, ipcMain, shell } = require("electron");
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const slash = require('slash');

// Set Environment
process.env.NODE_ENV = "development";

const isDev = process.env.NODE_ENV !== "production" ? true : false;
const isMac = process.platform === "darwin" ? true : false;

let mainWindow;
let aboutWidow;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        title: "ImageShrink",
        width: isDev ? 800 : 500,
        height: 600,
        // icon: "./assets/icon/Icon_256x256.png",
        resizable: isDev ? true : false,
        backgroundColor: "white",
        webPreferences: {
            nodeIntegration: true,
        },
    });

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.loadFile("./app/index.html");
}

function createAboutWindow() {
    aboutWidow = new BrowserWindow({
        title: " About ImageShrink",
        width: 300,
        height: 300,
        // icon: "./assets/icon/Icon_256x256.png",
        resizable: false,
        backgroundColor: "white",
    });

    aboutWidow.loadFile("./app/about.html");
}

app.on("ready", () => {
    createMainWindow();
    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu);

    mainWindow.on("ready", () => (mainWindow = null));
});

// Menu Template
const menu = [
    ...(isMac
        ? [
            {
                label: app.name,
                submenu: [
                    {
                        label: "About",
                        click: createAboutWindow,
                    },
                ],
            },
        ]
        : []),

    {
        role: "fileMenu",
    },
    ...(!isMac
        ? [
            {
                label: "Help",
                submenu: [
                    {
                        label: "About",
                        click: createAboutWindow,
                    },
                ],
            },
        ]
        : []),
    ...(isDev
        ? [
            {
                label: "Developer",
                submenu: [
                    {
                        role: "reload",
                    },
                    {
                        role: "forcereload",
                    },
                    {
                        type: "separator",
                    },
                    {
                        role: "toggledevtools",
                    },
                ],
            },
        ]
        : []),
];

ipcMain.on("image:minimize", (e, options) => {
    options.dest = path.join(os.homedir(), 'imageshrink');
    shrinkImage(options);
});

async function shrinkImage({ imgPath: imgPath, quality, dest }) {
    try {
        const pngQuality = quality / 100
        const files = await imagemin([slash(imgPath)], {
            destination: dest,
            plugins: [
                imageminMozjpeg({ quality }),
                imageminPngquant({
                    quality: [pngQuality, pngQuality]
                })
            ]
        })

        console.log(files)
        shell.openPath(dest)

    } catch (err) {
        console.log(err);
    }
}

app.on("window-all-closed", () => {
    if (!isMac) {
        app.quit();
    }
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});
