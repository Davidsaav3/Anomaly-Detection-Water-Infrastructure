const fs = require('fs');

// Leer el archivo CSV
fs.readFile('scores.csv', 'utf8', (err, data) => {
  if (err) {
    console.error('Error al leer el archivo:', err);
    return;
  }

  // Dividir el contenido del archivo en líneas
  const lines = data.split('\n');

  // Procesar el encabezado
  const headers = lines[0].split(',');
  const filteredHeaders = headers.filter(header => header.trim() !== 'id' && header.trim() !== 'score');

  // Procesar las filas eliminando las columnas 'id' y 'score'
  const filteredRows = lines.slice(1).map(line => {
    const values = line.split(',');
    const filteredValues = values.filter((_, index) => headers[index].trim() !== 'id' && headers[index].trim() !== 'score');
    return filteredValues.join(',');
  });

  // Crear el nuevo contenido del archivo CSV
  const result = [filteredHeaders.join(','), ...filteredRows].join('\n');

  // Escribir el nuevo archivo CSV
  fs.writeFile('scores_filtered.csv', result, 'utf8', err => {
    if (err) {
      console.error('Error al escribir el archivo:', err);
    } else {
      console.log('El archivo scores_filtered.csv ha sido generado correctamente.');
    }
  });
});
