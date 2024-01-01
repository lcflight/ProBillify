const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('fs');
const Papa = require('papaparse');
const { dialog } = require('electron');
const pdfMake = require('pdfmake/build/pdfmake');
const pdfFonts = require('pdfmake/build/vfs_fonts');
pdfMake.vfs = pdfFonts.pdfMake.vfs;

const payee = {
  name: 'Luke Arthur',
  address: '123 Main St, Anytown, USA',
  email: 'lcarthur747@gmail.dom',
  phone: '123-456-7890',
};

const invoiceDetails = {
  Attention: 'John Doe',
  Date: '2021-01-01',
  ProjectTitle: 'Project 1',
  InvoiceNumber: '001',
  Term: '31 days',
  PaymentService: 'PayPal',
  PaymentAddress: 'email@gmail.com',
};

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'scripts', 'preload.js'),
    },
  });

  mainWindow.loadFile('index.html');
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('fileDropped', (event, filePath) => {
  console.log('fileDropped', filePath);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    let csvData = Papa.parse(data, { header: true });
    event.sender.send('fileParsed', csvData.data);
  });
});

ipcMain.on('exportPdf', (event, csvData) => {
  const docDefinition = {
    styles: {
      bodyText: {
        fontSize: 10,
        lineHeight: 1.2,
        alignment: 'left',
        color: '#000000',
      },
    },
    content: [
      {
        canvas: [
          {
            type: 'rect',
            x: 0,
            y: 0,
            w: 515, // width of the line, adjust as needed
            h: 3, // height of the line (thickness)
            color: '#367DA2', // color of the line
          },
        ],
        margin: [0, 20, 0, 0], // margin to push the line down from the top of the page
      },
      {
        text: `${payee.name}`,
        style: { color: '#367DA2', fontSize: 15, bold: true },
        margin: [0, 10, 0, 30],
      },
      {
        columns: [
          {
            width: '30%',
            text: [
              `${payee.name}\n`,
              `${payee.phone}\n`,
              `${payee.email}\n\n`,
              `${payee.address}\n`,
            ],
            style: 'bodyText',
            alignment: 'left',
            margin: [0, 0, 30, 0],
          },
          {
            width: '70%',
            stack: [
              {
                text: [
                  `Attention: ${invoiceDetails.Attention}\n`,
                  `Date: ${invoiceDetails.Date}\n\n`,
                  `Project Title: ${invoiceDetails.ProjectTitle}\n`,
                  `Invoice Number: ${invoiceDetails.InvoiceNumber}\n`,
                  `Term: ${invoiceDetails.Term}\n\n`,
                  `Payment Service: ${invoiceDetails.PaymentService}\n`,
                  `Payment Address: ${invoiceDetails.PaymentAddress}\n`,
                ],
                style: 'bodyText',
                alignment: 'left',
              },
              {
                table: {
                  headerRows: 1,
                  widths: ['49.99%', '16.67%', '16.67%', '16.67%'],
                  body: [
                    [
                      {
                        text: 'Description',
                        fillColor: '#367DA2',
                        color: 'white',
                      },
                      {
                        text: 'Quantity',
                        fillColor: '#367DA2',
                        color: 'white',
                      },
                      {
                        text: 'Unit Price',
                        fillColor: '#367DA2',
                        color: 'white',
                      },
                      { text: 'Cost', fillColor: '#367DA2', color: 'white' },
                    ],
                    ['Project 1', 2, 100, 200],
                    ['Project 2', 3, 150, 450],
                    ['Project 3', 1, 200, 200],
                    ['', '', 'Subtotal', 850],
                    [
                      {
                        text: 'Reimbursements',
                        fillColor: '#587B3C',
                        color: 'white',
                        colSpan: 4,
                      },
                      '',
                      '',
                      '',
                    ],
                    ['Reimbursement 1', 1, 50, 50],
                    ['', '', 'Total', 900],
                  ],
                  layout: {
                    hLineWidth: function (i, node) {
                      return 0.5; // Make horizontal lines thinner
                    },
                    vLineWidth: function (i, node) {
                      return 0.5; // Make vertical lines thinner
                    },
                  },
                },
                margin: [0, 50, 0, 0],
              },
            ],
          },
        ],
      },
    ],
  };

  const pdfDocGenerator = pdfMake.createPdf(docDefinition);

  dialog
    .showSaveDialog({
      title: 'Save PDF',
      filters: [{ name: 'PDFs', extensions: ['pdf'] }],
    })
    .then((result) => {
      if (!result.canceled) {
        pdfDocGenerator.getBuffer((buffer) => {
          fs.writeFileSync(result.filePath, buffer);
        });
      }
    });
});
