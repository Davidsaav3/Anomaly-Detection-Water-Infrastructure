const fs = require('fs');
const csv = require('csv-parser');

// [ EJECUTAR PROCESO Y GUARDAR RESULTADOS ]
const args = process.argv.slice(2);
if (args.length === 1 && (args[0] === '-c' || args[0] === '-C')) {
  console.log(`input:2,output:1,config:1`);
  console.log(`./results/waterInfrastructure/encoding.csv   ./results/waterInfrastructure/auxiliaryNulls.csv   ./results/waterInfrastructure/nulls.csv    ./exec/waterConfig.json`);
  process.exit(0);
}
if (args.length !== 4) {
  console.error('! ERROR: INPUT !');
  process.exit(1);
}

const inputFile = args[0];
const nullsFile = args[1];
const outputFile = args[2];
const configPath = args[3] ? args[3] : './config.json';
let config = {};

// [ CARGAR CONFIGURACIÓN ]
try {
  const configFile = fs.readFileSync(configPath);
  config = JSON.parse(configFile);
} catch (error) {
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
    headers.join(','), // CABECERAS
    ...data.map(row => headers.map(header => row[header] ?? '').join(',')) // FORMAR ARCHIVO
  ].join('\n');
  fs.writeFileSync(fileName, csvContent); // GUARDAR
  console.log(`[ NULLS: ${fileName} ]`);
};

// [ *** MAIN ]
async function main(inputFile, nullsFile) { 
  try {
    const { headers, results } = await readCSV(inputFile); // LEER CSV PRINCIPAL
    const { results: nullValues } = await readCSV(nullsFile); // LEER CSV DE NULOS
    if (nullValues.length === 0) throw new Error('EMPTY NULLS FILE'); // ARCHIVO DE NULOS NO VACÍO
    const values1 = nullValues[0]; // VALORES DE PRIMERA FILA DE NULOS

    // ENCONTRAR COLUMNAS CON 'R'
    const columnsToCheck = Object.keys(values1).filter(
      (header) => config.nulls.remove.includes(values1[header])
    );

    // FILTRAR FILAS EN BASE A COLUMNAS ESPECIFICADAS EN columnsToCheck
    const filteredResults = results.filter(row => {
      return columnsToCheck.every(header => row[header] !== null && row[header] !== 'null' && row[header] !== '');
    });

    // MAPEAR Y NORMALIZAR DATOS
    const normalizedData = filteredResults.map(row => {
      return headers.reduce((newRow, header) => {
        newRow[header] = (row[header] === null || row[header] === 'null' || row[header] === '')
          ? (header in values1 ? values1[header] : null) // REMPLAZAR CON LO DEL ARCHIVO NULLS
          : row[header]; // MANTENER VALOR ORIGINAL SI NO ES NULO
        return newRow;
      }, {});
    });

    return normalizedData;
  } catch (error) {
    console.error('! ERROR ! ', error);
  }
}

main(inputFile, nullsFile)
  .then(data => {
    saveCSV(data, data.length ? Object.keys(data[0]) : [], outputFile); // GUARDAR RESULTADOS
  })
  .catch(error => console.error('! ERROR ! ', error));
