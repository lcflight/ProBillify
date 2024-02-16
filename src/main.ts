const payee = require('../src/utils/payee.ts');
const invoiceDetails = require('../src/utils/invoiceDetails.ts');
// const reimbursements = require('./utils/reimbursements.js');
const convertDuration = require('../src/utils/convertDuration.ts');

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
    width: 1000,
    height: 800,
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

let canChangeDropzoneId = true;

ipcMain.on('fileDropped', (event, filePath) => {
  console.log('fileDropped', filePath);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    let csvData = Papa.parse(data, { header: true });

    // Remove any objects without a 'Project' property or with an empty 'Project' property
    csvData.data = csvData.data.filter(
      (item) => item.Project && item.Project.trim() !== '',
    );

    // Get the unique project names and check for undefined projects
    const projectNames = [];
    csvData.data.forEach((item) => {
      if (item.Project === undefined) {
        console.log('Undefined project:', item); // Log the undefined project
      } else if (!projectNames.includes(item.Project)) {
        projectNames.push(item.Project);
      }
    });

    event.sender.send('fileParsed', csvData.data);
    event.sender.send('projectNames', projectNames);

    // Read the unit prices from the file
    let unitPrices = {};
    if (fs.existsSync(unitPricesPath)) {
      unitPrices = JSON.parse(fs.readFileSync(unitPricesPath, 'utf8'));
    }

    // Send renderer process
    event.sender.send('unitPrices', unitPrices);

    // Only emit the 'changeDropzoneId' event if the timeout has passed
    if (canChangeDropzoneId) {
      event.sender.send('changeDropzoneId');
      canChangeDropzoneId = false; // Prevent the event from being emitted again immediately
      console.log('changeDropzoneId emitted');

      // After a delay, allow the event to be emitted again
      setTimeout(() => {
        canChangeDropzoneId = true;
        console.log('canChangeDropzoneId set to true');
      }, 3000); // 3000 milliseconds = 3 seconds
    }
  });
});

let unitPrices = {};

ipcMain.on('unitPrices', (event, prices) => {
  // Store the unit prices
  unitPrices = prices;
  // Write the unit prices to a file
  fs.writeFileSync(unitPricesPath, JSON.stringify(unitPrices));
});

ipcMain.on('exportPdf', (event, lineItems, unitPrices, reimbursements) => {
  // Group the items by the 'Project' property
  const groupedItems = lineItems.reduce((groups, item) => {
    if (item.Project && item.Duration) {
      const key = item.Project;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    }
    return groups;
  }, {});

  // Sum the 'Duration' for each group and calculate 'Amount (USD)' based on the 'Duration' and unit price
  const summedItems = Object.values(groupedItems).map((group) => {
    return group.reduce((sum, item) => {
      // Parse the duration into hours
      const durationInHours = convertDuration(item.Duration);

      // Calculate the amount based on the duration and unit price
      const unitPrice = unitPrices[item.Project] || 0;
      const amount = durationInHours * unitPrice;

      return {
        Project: item.Project,
        Duration: (sum.Duration || 0) + durationInHours,
        'Amount (USD)': (sum['Amount (USD)'] || 0) + amount,
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
              `${payee.name}\n`, //TODO: Change to payeeName
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
                      // Check if unitPrices[item.Project] is defined
                      const unitPrice = unitPrices[item.Project];
                      if (unitPrice === undefined) {
                        console.error(
                          'Unit price is undefined for project:',
                          item.Project,
                        );
                        return [item.Project, '', '', ''];
                      }

                      return [
                        item.Project,
                        {
                          text: item.Duration.toFixed(2),
                          alignment: 'right',
                          style: 'tableText',
                        },
                        {
                          text: unitPrice.toFixed(2),
                          alignment: 'right',
                          style: 'tableText',
                        },
                        {
                          text: (item.Duration * unitPrice).toFixed(2),
                          alignment: 'right',
                          style: 'tableText',
                        },
                      ];
                    }),
                    [
                      '',
                      '',
                      'Subtotal',
                      {
                        text: summedItems
                          .reduce(
                            (total, item) =>
                              total +
                              (item.Duration || 0) *
                                (unitPrices[item.Project] || 0),
                            0,
                          )
                          .toFixed(2),
                        alignment: 'right',
                      },
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
                      {
                        text: Number(item.cost).toFixed(2),
                        alignment: 'right',
                      },
                    ]),
                    [
                      '',
                      '',
                      'Total',
                      {
                        text: (
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
                          )
                        ).toFixed(2),
                        alignment: 'right',
                      },
                    ],
                  ],
                  layout: {
                    hLineWidth: function () {
                      return 0.5; // Make horizontal lines thinner
                    },
                    vLineWidth: function () {
                      return 0.5; // Make vertical lines thinner
                    },
                    fontSize: function () {
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
