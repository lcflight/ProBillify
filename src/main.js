const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("fs");
const Papa = require("papaparse");
const { dialog } = require("electron");
const pdfMake = require("pdfmake/build/pdfmake");
const pdfFonts = require("pdfmake/build/vfs_fonts");
pdfMake.vfs = pdfFonts.pdfMake.vfs;

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, "scripts", "preload.js"),
    },
  });

  mainWindow.loadFile("index.html");
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.on("fileDropped", (event, filePath) => {
  console.log("fileDropped", filePath);
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    let csvData = Papa.parse(data, { header: true });
    event.sender.send("fileParsed", csvData.data);
  });
});

ipcMain.on("exportPdf", (event, csvData) => {
  const docDefinition = {
    content: [
      { text: "CSV Data", style: "header" },
      JSON.stringify(csvData, null, 2),
    ],
  };

  const pdfDocGenerator = pdfMake.createPdf(docDefinition);

  dialog
    .showSaveDialog({
      title: "Save PDF",
      filters: [{ name: "PDFs", extensions: ["pdf"] }],
    })
    .then((result) => {
      if (!result.canceled) {
        pdfDocGenerator.getBuffer((buffer) => {
          fs.writeFileSync(result.filePath, buffer);
        });
      }
    });
});
