const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// OBTENER PARÁMETROS DE LA LÍNEA DE COMANDOS
const args = process.argv.slice(2);
if (args.length < 3) {
  console.error('! ERROR: INPUT, OUTPUT, AND CONFIG NEEDED !');
  process.exit(1);
}

const inputFile = args[0];
const outputFile = args[1];
const configPath = args[2] ? args[2] : './config.json';

let config = {};

// CARGAR CONFIGURACIÓN DESDE EL ARCHIVO JSON (O USAR VALORES POR DEFECTO)
try {
  const configFile = fs.readFileSync(configPath);
  config = JSON.parse(configFile);
} catch (error) {
  console.error(`! ERROR: NO SE PUDO LEER ${configPath}, USANDO CONFIGURACIÓN POR DEFECTO !`, error);
  process.exit(1);
}

// LEER CSV ORIGINAL
function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

// GUARDAR RESULTADO EN CSV
function saveToCSV(data, outputFilename) {
  const csvRows = [];
  const headers = Object.keys(data[0]);
  csvRows.push(headers.join(',')); // AÑADIR CABECERAS

  data.forEach(obj => {
    const values = headers.map(header => {
      let stringValue = (typeof obj[header] === 'string') ? obj[header].replace(/"/g, '""') : String(obj[header]);
      return (typeof obj[header] === 'string') ? `'${stringValue}'` : stringValue;
    });
    csvRows.push(values.join(',')); // AÑADIR FILA
  });

  fs.writeFileSync(outputFilename, csvRows.join('\n')); // ESCRIBIR CSV
  console.log(`[ OUTPUT: ${outputFilename} ]`);
}

// FILTRAR Y GUARDAR CSV
async function filterAndSaveCSV(inputFilePath, outputFileName) {
  try {
    const data = await readCSV(inputFilePath);

    // ELIMINAR LAS COLUMNAS ESPECIFICADAS EN LA CONFIGURACIÓN
    const columnsToDelete = config.filter.delete;
    const filteredData = data.map(row => {
      const newRow = { ...row }; // Hacer una copia del objeto
      columnsToDelete.forEach(col => delete newRow[col]); // Eliminar columnas
      return newRow; // Devolver la nueva fila filtrada
    });

    saveToCSV(filteredData, outputFileName); // GUARDAR CSV
  } 
  catch (error) {
    console.error('! ERROR ! ', error);
  }
}

filterAndSaveCSV(inputFile, outputFile);
