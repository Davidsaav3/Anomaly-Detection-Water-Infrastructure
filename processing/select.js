const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

function filterAndCompareCSV(file1, file2, outputFile) {
  const data1 = [];
  const data2 = [];
  let lowestScoreRow = null;

  // Leer el primer archivo
  fs.createReadStream(file1)
    .pipe(csv())
    .on('data', (row) => {
      if (row.truth === '1') {
        data1.push(row);
      }
    })
    .on('end', () => {
      // Leer el segundo archivo
      fs.createReadStream(file2)
        .pipe(csv())
        .on('data', (row) => {
          data2.push(row);
        })
        .on('end', () => {
          // Comparar filas basándose en las columnas coincidentes
          data1.forEach((row1) => {
            data2.forEach((row2) => {
              const isMatching = Object.keys(row1).every((key) => {
                if (key === 'truth') return true; // Ignorar la columna "truth"
                return row2[key] === row1[key];
              });

              if (isMatching) {
                const score = parseFloat(row2.score); // Convertir score a float
                if (
                  !lowestScoreRow || 
                  score < parseFloat(lowestScoreRow.score)
                ) {
                  lowestScoreRow = { ...row1, score: row2.score }; // Actualizar con la fila de menor score
                  delete lowestScoreRow.truth; // Eliminar la columna "truth"
                }
              }
            });
          });

          // Guardar la fila con el valor más bajo de "score" en el archivo de salida
          if (lowestScoreRow) {
            const header = Object.keys(lowestScoreRow).join(',');
            const row = Object.values(lowestScoreRow).join(',');
            const outputData = `${header}\n${row}`;
            fs.writeFileSync(outputFile, outputData);
            console.log(`Archivo de salida creado: ${outputFile}`);
          } else {
            console.log('No se encontraron coincidencias.');
          }
        });
    });
}

async function automateFilterAndCompare() {
  // Iterar sobre los valores de 10 a 200 (de 10 en 10)
  for (let i = 10; i <= 200; i += 10) {
    const file1 = path.resolve(`./results/umbral/pollution_45_${i}.csv`);
    const file2 = path.resolve(`./results/umbral/45_${i}/scores.csv`);
    const outputFile = path.resolve(`45_${i}.csv`);

    console.log(`Procesando: pollution_45_${i}.csv y scores_${i}.csv`);
    
    await new Promise((resolve, reject) => {
      try {
        filterAndCompareCSV(file1, file2, outputFile);
        resolve();
      } catch (err) {
        reject(`Error procesando el archivo ${i}: ${err}`);
      }
    });
  }
}

// Ejecutar la automatización
automateFilterAndCompare()
  .then(() => {
    console.log('Automatización completada.');
  })
  .catch((err) => {
    console.error('Error en la automatización:', err);
  });
