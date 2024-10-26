const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// CARGAR CONFIGURACIÓN DESDE EL ARCHIVO JSON (O USAR VALORES POR DEFECTO)
const loadConfig = (configPath) => {
  let config = {};
  try {
    const configFile = fs.readFileSync(configPath);
    config = JSON.parse(configFile);
  } catch (error) {
    console.error(`! ERROR: NO SE PUDO LEER ${configPath}, USANDO CONFIGURACIÓN POR DEFECTO !`, error);
    process.exit(1);
  }
  return config;
};

// LEER CSV Y DEVOLVER RESULTADOS COMO JSON
const readCSV = (filePath) => new Promise((resolve, reject) => {
  const results = [];
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data)) 
    .on('end', () => resolve(results)) 
    .on('error', reject); 
});

// GUARDAR RESULTADOS EN UN ARCHIVO JSON
const saveToJSON = (data, fileName) => {
  fs.writeFileSync(fileName, JSON.stringify(data, null, 2)); // GUARDAR JSON FORMATEADO
  console.log(`[ JSON: ${fileName}.json ]`); // CONFIRMAR GUARDADO
};

// FUNCIÓN PRINCIPAL PARA LEER CSV Y GUARDARLO COMO JSON
async function csvToJson(inputFile) {
  try {
    const data = await readCSV(inputFile); // LEER CSV
    return data;
  } catch (error) {
    console.error('! ERROR ! ', error);
  }
}

// EJECUTAR Y GUARDAR RESULTADOS
const args = process.argv.slice(2);
if (args.length !== 3) {
  console.error('! ERROR: INPUT, OUTPUT, AND CONFIG NEEDED !'); 
  process.exit(1);
}

const inputFile = args[0];
const outputFile = args[1];
const configPath = args[2] ? args[2] : './config.json';

// CARGAR CONFIGURACIÓN
const config = loadConfig(configPath);

// PROCESAR CSV A JSON
csvToJson(inputFile)
  .then(data => {
    saveToJSON(data, outputFile); // GUARDAR JSON
  })
  .catch(error => console.error('! ERROR ! ', error));
