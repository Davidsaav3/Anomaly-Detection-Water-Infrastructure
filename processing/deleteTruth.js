const fs = require('fs');
const csv = require('csv-parser');

// [ OBTENER PARÁMETROS ]
const args = process.argv.slice(2);
if (args.length < 3) {
  console.error('! ERROR: INPUT !'); // ERROR SI FALTAN ARGUMENTOS
  process.exit(1);
}

const inputFile = args[0];
const outputFile = args[1];
const configPath = args[2] ? args[2] : './config.json';
let config = {};

// [ CARGAR CONFIGURACIÓN ]
try {
  const configFile = fs.readFileSync(configPath); // LEER
  config = JSON.parse(configFile); // PARSEAR CONFIGURACIÓN
}
catch (error) {
  console.error(`! ERROR: CONFIG ${configPath} !`, error); // ERROR
  process.exit(1);
}

// [ LEER CSV ORIGINAL ]
function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data)) // AÑADIR DATOS A RESULTADOS
      .on('end', () => resolve(results)) // RESOLVER PROMESA CUANDO TERMINE
      .on('error', (error) => reject(error)); // RECHAZAR PROMESA 
  });
}

// [ GUARDAR RESULTADO EN CSV ]
function saveCSV(data, outputFilename) {
  const csvRows = [];
  const headers = Object.keys(data[0]); // CABECERAS
  csvRows.push(headers.join(',')); // AÑADIR CABECERAS
  data.forEach(obj => {
    const values = headers.map(header => {
      let stringValue = String(obj[header]); // PASAR A STRING
      return stringValue; 
    });
    csvRows.push(values.join(',')); // AÑADIR FILA
  });
  fs.writeFileSync(outputFilename, csvRows.join('\n')); // GUARDAR
  console.log(`[ DELETE TRUTH: ${outputFilename} ]`);
}

// [ *** MAIN ]
async function main(inputFilePath, outputFileName) {
  try {
    const data = await readCSV(inputFilePath);
    const columnsToDelete = config.deleteTruth.delete; //   COLUMNAS A ELIMINAR
    const filteredData = data.map(row => {
      const newRow = { ...row }; // COPIA DEL OBJETO
      columnsToDelete.forEach(col => delete newRow[col]); // ELIMINAR COLUMNAS
      return newRow; // NUEVA FILA FILTRADA
    });
    saveCSV(filteredData, outputFileName); // GUARDAR
  }
  catch (error) {
    console.error('! ERROR ! ', error);
  }
}

main(inputFile, outputFile); 
