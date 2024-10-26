const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// OBTENER PARÁMETROS DE LA LÍNEA DE COMANDOS
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('! ERROR: INPUT, AND CONFIG NEEDED !');
  process.exit(1);
}

let config = {};

const inputFile = args[0];
const configPath = args[1] ? args[1] : './config.json';


// CARGAR CONFIGURACIÓN DESDE EL ARCHIVO JSON (O USAR VALORES POR DEFECTO)
try {
  const configFile = fs.readFileSync(configPath);
  config = JSON.parse(configFile);
} 
catch (error) {
  console.error(`! ERROR: NO SE PUDO LEER ${configPath}, USANDO CONFIGURACIÓN POR DEFECTO !`, error);
  process.exit(1);
}

const outputDir = path.join(__dirname, config.separate.folder_separate);

// LEER CSV ORIGINAL
async function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    let headers = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('headers', headerList => { headers = headerList; })
      .on('data', data => results.push(data))
      .on('end', () => resolve({ headers, results }))
      .on('error', reject);
  });
}

// GUARDAR CSV
function saveToCSV(data, headers, groupName) {
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => row[header] !== undefined ? row[header] : '').join(','))
  ].join('\n');

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const outputFileName = `${groupName.toLowerCase()}.csv`; // USAR NOMBRE DEL GRUPO EN VEZ DE outputFile
  fs.writeFileSync(path.join(outputDir, outputFileName), csvContent);
  console.log(`[ SEPARATE: ${outputFileName} ]`);
}

// DIVIDIR EN GRUPOS
function divideIntoGroups(data, groupHeaders) {
  return data.map(row => {
    const newRow = {};
    groupHeaders.forEach(header => { newRow[header] = row[header] || ''; });
    return newRow;
  });
}

// PREPARAR DATOS
async function prepareData(inputFile) {
  try {
    const { headers, results } = await readCSV(inputFile);

    // OBTENER GRUPOS DE LA CONFIGURACIÓN
    const groups = config.separate.groups.reduce((acc, group) => {
      acc[group.output] = group.fields;
      return acc;
    }, {});

    // DIVIDIR Y GUARDAR CADA GRUPO
    for (const [groupName, groupHeaders] of Object.entries(groups)) {
      const groupData = divideIntoGroups(results, groupHeaders);
      saveToCSV(groupData, groupHeaders, groupName); // PASAR NOMBRE DEL GRUPO
    }
  } 
  catch (error) {
    console.error('ERROR AL PROCESAR:', error);
  }
}

prepareData(inputFile);
