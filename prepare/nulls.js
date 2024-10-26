const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// EJECUTAR PROCESO Y GUARDAR RESULTADOS
const args = process.argv.slice(2);
if (args.length !== 4) {
  console.error('! ERROR: INPUT, OUTPUT, NULLS FILE AND CONFIG NEEDED !'); 
  process.exit(1);
}

const inputFile = args[0];
const outputFile = args[1];
const nullsFile = args[2];
const configPath = args[3] ? args[3] : './config.json';

let config = {};

// CARGAR CONFIGURACIÓN DESDE EL ARCHIVO JSON (O USAR VALORES POR DEFECTO)
try {
  const configFile = fs.readFileSync(configPath);
  config = JSON.parse(configFile);
} 
catch (error) {
  console.error(`! ERROR: NO SE PUDO LEER ${configPath}, USANDO CONFIGURACIÓN POR DEFECTO !`, error);
  process.exit(1);
}

// LEER CSV Y DEVOLVER CABECERAS Y RESULTADOS
const readCSV = (filePath) => new Promise((resolve, reject) => {
  const results = [];
  let headers = [];
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('headers', (headerList) => { headers = headerList; }) 
    .on('data', (data) => results.push(data)) 
    .on('end', () => resolve({ headers, results })) 
    .on('error', reject); 
});

// GUARDAR CSV
const saveToCSV = (data, headers, fileName) => {
  const csvContent = [
    headers.join(','), 
    ...data.map(row => headers.map(header => row[header] ?? '').join(','))
  ].join('\n');
  fs.writeFileSync(fileName, csvContent); // ESCRIBIR CSV
  console.log(`[ NULLS: ${fileName} ]`); // CONFIRMAR GUARDADO
};

// PREPARAR DATOS Y MANEJAR NULOS
async function nulls(inputFile, nullsFile) {
  try {
    const { headers, results } = await readCSV(inputFile); // LEER CSV
    const { results: results1 } = await readCSV(nullsFile); // LEER ARCHIVO NULLS
    if (results1.length === 0) throw new Error('ARCHIVO NULLS VACÍO.');
    const values1 = results1[0];
    return results.map(row => {
      // NORMALIZAR DATOS
      return headers.reduce((newRow, header) => {
        newRow[header] = row[header] === null || row[header] === 'null' || row[header] === '' || row[header] === '0'
          ? (values1[header] === '0' ? '0' : null)
          : row[header];
        return newRow;
      }, {});
    });
  } 
  catch (error) {
    console.error('! ERROR ! ', error);
  }
}


nulls(inputFile, nullsFile)
  .then(data => {
    saveToCSV(data, data.length ? Object.keys(data[0]) : [], outputFile); 
  })
  .catch(error => console.error('! ERROR ! ', error));
