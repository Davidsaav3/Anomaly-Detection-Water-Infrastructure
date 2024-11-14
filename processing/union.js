const fs = require('fs');
const csv = require('csv-parser');

// [ OBTENER PARÁMETROS ]
const args = process.argv.slice(2);
if (args.length < 4) {
  console.error('! ERROR: INPUT !');
  process.exit(1);
}

const baseFile = args[0];
const singleRecordFile = args[1];
const monthInput = parseInt(args[2]);
const hourInput = parseInt(args[3]);

// [ LEER CSV ]
async function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', data => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// [ GUARDAR CSV ]
function saveCSV(data, headers, fileName) {
  const csvContent = [
    headers.join(','), // CABECERA
    ...data.map(row => headers.map(header => row[header] ?? '').join(',')) // FILAS FORMATEADAS
  ].join('\n');
  fs.writeFileSync(fileName, csvContent);
  console.log(`[ OUTPUT FILE: ${fileName} ]`);
}

// [ FILTRAR Y CREAR DATASET ]
function filterData(data, month, hour, halfMonths) {
  const previousMonths = Array.from({ length: halfMonths }, (_, i) => (month - i - 1 + 12) % 12 || 12);
  const nextMonths = Array.from({ length: halfMonths }, (_, i) => (month + i + 1 - 1) % 12 + 1);
  
  const previousYear = new Date().getFullYear() - 1;

  const filteredData = data.filter(row => {
    const rowMonth = parseInt(row.mouth);
    const rowHour = parseInt(row.hour);
    const rowYear = parseInt(row.year);

    return (previousMonths.includes(rowMonth) && rowYear === previousYear && rowHour === hour) ||
           (nextMonths.includes(rowMonth) && rowYear === previousYear && rowHour === hour);
  });

  return filteredData;
}

// [ MAIN ]
async function main() {
  try {
    const baseData = await readCSV(baseFile);
    const singleRecord = await readCSV(singleRecordFile);
    if (singleRecord.length !== 1) {
      throw new Error('The single record file must contain exactly one record.');
    }

    const halfMonths = Math.floor(baseData.length / 2); // Número de meses previos y posteriores

    // Filtrar datos base
    const filteredData = filterData(baseData, monthInput, hourInput, halfMonths);

    // Insertar el registro único en el centro
    const finalData = [
      ...filteredData.slice(0, Math.floor(filteredData.length / 2)),
      singleRecord[0], // Insertar registro único
      ...filteredData.slice(Math.floor(filteredData.length / 2)),
    ];

    // Crear cabecera
    const headers = Object.keys(finalData[0]);

    // Guardar en archivo de salida
    saveCSV(finalData, headers, args[4]);
  } catch (error) {
    console.error('ERROR:', error);
  }
}

main();
