const fs = require('fs');
const csv = require('csv-parser');

// [ EJECUTAR PROCESO Y GUARDAR RESULTADOS ]
const args = process.argv.slice(2);
if (args.length !== 4) {
  console.error('! ERROR: INPUT !');
  process.exit(1);
}

const inputFile = args[0];
const outputFile = args[1];
const nullsFile = args[2];
const configPath = args[3] ? args[3] : './config.json';
let config = {};

// [ CARGAR CONFIGURACIÓN ]
try {
  const configFile = fs.readFileSync(configPath);
  config = JSON.parse(configFile);
}
catch (error) {
  console.error(`! ERROR: CONFIG ${configPath} !`, error);
  process.exit(1);
}

// [ LEER CSV Y DEVOLVER CABECERAS Y RESULTADOS ]
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

// [ GUARDAR CSV ]
const saveCSV = (data, headers, fileName) => {
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => row[header] ?? '').join(',')) // FORMAR ARCHIVO 
  ].join('\n');
  fs.writeFileSync(fileName, csvContent); // GUARDAR
  console.log(`[ NULLS: ${fileName} ]`);
};

// [ *** MAIN ]
async function main(inputFile, nullsFile) { 
  try {
    const { headers, results } = await readCSV(inputFile); // LEER CSV 
    const { results: results1 } = await readCSV(nullsFile); // LEER NULOS
    if (results1.length === 0) throw new Error('EMPTY NULLS FILE'); // ARCHIVO DE NULOS NO VACÍO
    const values1 = results1[0]; // VALORES DE PRIMERA FILA DE NULOS
    return results.map(row => { // MAPEAR CADA FILA DEL CSV 
      return headers.reduce((newRow, header) => { // RECORRER CADA ENCABEZADO
        newRow[header] = row[header] === null || row[header] === 'null' || row[header] === '' || row[header] === '0'
          ? (values1[header] === '0' ? '0' : null) // SUSTITUIR VALORES NULOS SEGÚN ARCHIVO DE NULOS
          : row[header]; // MANTENER VALOR ORIGINAL SI NO ES NULO
        return newRow; // NUEVA FILA
      }, {});
    });
  }
  catch (error) {
    console.error('! ERROR ! ', error); // CAPTURAR Y MOSTRAR ERRORES
  }
}

main(inputFile, nullsFile)
  .then(data => {
    saveCSV(data, data.length ? Object.keys(data[0]) : [], outputFile); // GUARDAR
  })
  .catch(error => console.error('! ERROR ! ', error));