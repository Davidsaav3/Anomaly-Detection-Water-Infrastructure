const fs = require('fs'); // Usamos el módulo fs para manejar archivos

// Función para ajustar el mes, comparando el mes objetivo con el año
function adjustMonthRange(year, month, targetMonth) {
    let startMonth = targetMonth - 1;  // Un mes antes
    let endMonth = targetMonth + 1;    // Un mes después
    
    // Si el mes de inicio es menor que 1 (enero), ajustamos el año
    if (startMonth < 1) {
        startMonth = 12;
        year -= 1; // Cambiar al año anterior
    }

    // Si el mes de fin es mayor que 12 (diciembre), ajustamos el año
    if (endMonth > 12) {
        endMonth = 1;
        year += 1; // Cambiar al año siguiente
    }

    return { year, startMonth, endMonth };
}

// Función para filtrar las horas según la hora objetivo
function adjustHourRange(hour, targetHour) {
    const startHour = targetHour - 1; // Una hora antes
    const endHour = targetHour + 1;   // Una hora después
    return { startHour, endHour };
}

// Función para procesar el archivo CSV
function processCSV(inputFile, outputFile, referenceFile) {
    // Leer el archivo CSV de entrada
    const inputCSV = fs.readFileSync(inputFile, 'utf8');
    
    // Leer el archivo de referencia para obtener mes, hora y año
    const referenceCSV = fs.readFileSync(referenceFile, 'utf8');
    
    // Convertimos el CSV de referencia en un arreglo de líneas
    const referenceLine = referenceCSV.split('\n')[1].split(','); // Solo una línea
    const targetYear = parseInt(referenceLine[0]);  // Año del archivo de referencia
    const targetMonth = parseInt(referenceLine[1]);  // Mes del archivo de referencia
    const targetHour = parseInt(referenceLine[4]);  // Hora del archivo de referencia
    
    console.log(`Filtrando para el año ${targetYear}, mes ${targetMonth} y la hora ${targetHour}`);

    // Convertimos el CSV de entrada en un arreglo de líneas
    const lines = inputCSV.split('\n').map(line => line.split(','));

    // Convertimos la cabecera (primer línea) y las líneas de datos
    const header = lines[0];
    const data = lines.slice(1);

    // Dividir los datos en tres partes
    const beforeReference = [];
    const referenceData = [];
    const afterReference = [];

    // Procesar las filas de datos
    data.forEach(row => {
        let [year, month, day, hour, min, n_px, ce_px, cs_px, n_p, i_uiip, p_uiip, i_f, p_f, i_uiipu, c_pu_p, p_pu] = row;

        // Convertir los valores a los tipos correctos
        year = parseInt(year);
        month = parseInt(month);
        hour = parseInt(hour);
        min = parseInt(min);

        // Verificar si el año es el año de referencia
        if (year !== targetYear) return;

        // Ajustar el año y mes según el mes objetivo (targetMonth)
        const { year: newYear, startMonth, endMonth } = adjustMonthRange(year, month, targetMonth);

        // Verificar si el mes está dentro del rango ajustado
        let newMonth = month;
        if (month < startMonth) {
            newMonth = startMonth;
        } else if (month > endMonth) {
            newMonth = endMonth;
        }

        // Ajustar las horas según la hora objetivo (targetHour)
        const { startHour, endHour } = adjustHourRange(hour, targetHour);

        // Filtrar las filas según el mes, hora y día
        if (month < targetMonth || (month === targetMonth && hour < targetHour - 1)) {
            // Filas anteriores al rango de referencia
            beforeReference.push([newYear, newMonth, day, hour, min, n_px, ce_px, cs_px, n_p, i_uiip, p_uiip, i_f, p_f, i_uiipu, c_pu_p, p_pu].join(','));
        } else if ((month === targetMonth && hour >= startHour && hour <= endHour)) {
            // Filas exactamente en el rango de la fecha de referencia (de 5 a 7 si la hora de referencia es 6)
            referenceData.push([newYear, newMonth, day, hour, min, n_px, ce_px, cs_px, n_p, i_uiip, p_uiip, i_f, p_f, i_uiipu, c_pu_p, p_pu].join(','));
        } else {
            // Filas posteriores al rango de referencia
            afterReference.push([newYear, newMonth, day, hour, min, n_px, ce_px, cs_px, n_p, i_uiip, p_uiip, i_f, p_f, i_uiipu, c_pu_p, p_pu].join(','));
        }
    });

    // Combinar las tres partes
    const resultCSV = [
        header.join(','),
        ...beforeReference,
        ...referenceData,
        ...afterReference
    ].join('\n');

    // Escribir el archivo CSV de salida
    fs.writeFileSync(outputFile, resultCSV, 'utf8');
}

// Obtener los parámetros de la línea de comandos
const args = process.argv.slice(2);

// Verificar si tenemos los parámetros necesarios
if (args.length !== 3) {
    console.log('Uso: node script.js <archivo_entrada> <archivo_salida> <archivo_referencia>');
    process.exit(1);
}

const inputFile = args[0];   // Archivo de entrada
const outputFile = args[1];  // Archivo de salida
const referenceFile = args[2]; // Archivo de referencia con el mes, año y hora

// Llamar a la función para procesar el CSV
processCSV(inputFile, outputFile, referenceFile);

console.log(`El archivo procesado se ha guardado como ${outputFile}`);
