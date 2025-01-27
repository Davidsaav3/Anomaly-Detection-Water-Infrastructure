const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Lista de valores de x
const xValues = [1, 9, 18, 27, 36, 45];

// Función para leer los archivos CSV y obtener la columna 'score'
function getScoresFromFile(filePath) {
  return new Promise((resolve, reject) => {
    const scores = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        if (row.score) {
          scores.push(row.score);
        }
      })
      .on('end', () => {
        resolve(scores);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

// Función para generar el archivo x.csv
async function generateCSV() {
  for (const x of xValues) {
    const allScores = [];
    for (let y = 10; y <= 200; y += 10) {
      const filePath = path.join(__dirname, `${x}_${y}.csv`);
      try {
        const scores = await getScoresFromFile(filePath);
        allScores.push(...scores);  // Añadir los scores de cada archivo
      } catch (error) {
        console.error(`Error leyendo el archivo ${filePath}: ${error.message}`);
      }
    }

    // Crear el archivo x.csv con los valores de 'score'
    const outputFilePath = path.join(__dirname, `${x}.csv`);
    const outputData = allScores.join(',') + '\n';

    fs.writeFileSync(outputFilePath, outputData, 'utf8');
    console.log(`Archivo ${x}.csv generado correctamente.`);
  }
}

// Ejecutar la generación de CSV
generateCSV();
