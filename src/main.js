const payee = require('./utils/payee.js');
const invoiceDetails = require('./utils/invoiceDetails.js');
const lineItems = require('./utils/lineItems');
const reimbursements = require('./utils/reimbursements.js');
const convertDuration = require('./utils/convertDuration.js');

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('fs');
const Papa = require('papaparse');
const { dialog } = require('electron');
const pdfMake = require('pdfmake/build/pdfmake');
const pdfFonts = require('pdfmake/build/vfs_fonts');
pdfMake.vfs = pdfFonts.pdfMake.vfs;

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

const unitPricesPath = path.join(__dirname, 'unitPrices.json');

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

    // Get the unique project names
    const projectNames = [...new Set(csvData.data.map((item) => item.Project))];
    event.sender.send('projectNames', projectNames);

    // Read the unit prices from the file
    let unitPrices = {};
    if (fs.existsSync(unitPricesPath)) {
      unitPrices = JSON.parse(fs.readFileSync(unitPricesPath, 'utf8'));
    }

    // Send the unit prices to the renderer process
    event.sender.send('unitPrices', unitPrices);
  });
});

let unitPrices = {};

ipcMain.on('unitPrices', (event, prices) => {
  // Store the unit prices
  unitPrices = prices;
  // Write the unit prices to a file
  fs.writeFileSync(unitPricesPath, JSON.stringify(unitPrices));
});

ipcMain.on('exportPdf', (event, lineItems) => {
  // Group the items by the 'Project' property
  const groupedItems = lineItems.reduce((groups, item) => {
    if (item.Project && item.Duration && item['Amount (USD)']) {
      const key = item.Project;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    }
    return groups;
  }, {});

  // Sum the 'Duration' and 'Amount (USD)' for each group
  const summedItems = Object.values(groupedItems).map((group) => {
    return group.reduce((sum, item) => {
      // Parse the duration into hours
      const durationParts = item.Duration
        ? item.Duration.split(':')
        : ['0', '0', '0'];
      const durationInHours =
        Number(durationParts[0]) +
        Number(durationParts[1]) / 60 +
        Number(durationParts[2]) / 3600;

      // Parse the rate to remove the currency symbol and convert to a number
      const rate = item['Amount (USD)']
        ? Number(item['Amount (USD)'].replace(/[^0-9.-]+/g, ''))
        : 0;

      return {
        Project: item.Project,
        Duration: (sum.Duration || 0) + durationInHours,
        'Amount (USD)': (sum['Amount (USD)'] || 0) + rate,
      };
    }, {});
  });

  const docDefinition = {
    defaultStyle: {
      fontSize: 11,
    },
    styles: {
      bodyText: {
        fontSize: 10,
        lineHeight: 1.2,
        alignment: 'left',
        color: '#000000',
      },
      tableText: {
        fontSize: 11,
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
                        style: 'tableText',
                      },
                      {
                        text: 'Quantity',
                        fillColor: '#367DA2',
                        color: 'white',
                        style: 'tableText',
                      },
                      {
                        text: 'Unit Price',
                        fillColor: '#367DA2',
                        color: 'white',
                        style: 'tableText',
                      },
                      { text: 'Cost', fillColor: '#367DA2', color: 'white' },
                    ],
                    ...summedItems.map((item) => {
                      return [
                        item.Project,
                        {
                          text: item.Duration.toFixed(2),
                          alignment: 'right',
                          style: 'tableText',
                        },
                        {
                          text: unitPrices[item.Project].toFixed(2),
                          alignment: 'right',
                          style: 'tableText',
                        },
                        {
                          text: (
                            item.Duration * unitPrices[item.Project]
                          ).toFixed(2),
                          alignment: 'right',
                          style: 'tableText',
                        },
                      ];
                    }),
                    [
                      '',
                      '',
                      'Subtotal',
                      summedItems
                        .reduce(
                          (total, item) =>
                            total +
                            (item.Duration || 0) *
                              (unitPrices[item.Project] || 0),
                          0,
                        )
                        .toFixed(2),
                    ],
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
                    ...reimbursements.map((item) => [
                      item.title,
                      '',
                      '',
                      item.cost,
                    ]),
                    [
                      '',
                      '',
                      'Total',
                      summedItems.reduce(
                        (total, item) =>
                          total +
                          (item.Duration || 0) *
                            (unitPrices[item.Project] || 0),
                        0,
                      ) +
                        reimbursements.reduce(
                          (total, item) => total + Number(item.cost),
                          0,
                        ),
                    ],
                  ],
                  layout: {
                    hLineWidth: function (i, node) {
                      return 0.5; // Make horizontal lines thinner
                    },
                    vLineWidth: function (i, node) {
                      return 0.5; // Make vertical lines thinner
                    },
                    fontSize: function (row, node) {
                      return 11;
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
