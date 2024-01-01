const { ipcRenderer } = require("electron");

document.addEventListener("DOMContentLoaded", (event) => {
  const dropzone = document.getElementById("dropzone");
  const csvContentDiv = document.getElementById("csv-content");
  const exportButton = document.getElementById("export-button");

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();

    let file = e.dataTransfer.files[0];
    ipcRenderer.send("fileDropped", file.path);
  });

  ipcRenderer.on("fileParsed", (event, data) => {
    csvContentDiv.innerText = JSON.stringify(data, null, 2);
  });

  exportButton.addEventListener("click", () => {
    try {
      const csvData = JSON.parse(csvContentDiv.innerText);
      ipcRenderer.send("exportPdf", csvData);
      console.log("exportButton clicked");
    } catch (error) {
      console.error("Failed to parse CSV data:", error);
    }
  });
});
