const fs = require('fs');
const _ = require('lodash');
const shuffleSeed = require('shuffle-seed');

// ELIMINA COMILLAS DE NOMBRES DE COLUMNA
function stripQuotes(columnName) {
    return columnName.replace(/^"(.*)"$/, '$1');
}

// EXTRAER CARACTERES DE UNA CADENA
function extractCharacter(columnName, regular, characterReplace) {
    return columnName.replace(regular, characterReplace);
}

// EXTRAER VALORES DE COLUMNAS
function extractColumns(data, columnNames) {
    const headers = _.first(data);
    const indexes = _.map(columnNames, column => headers.indexOf(column));
    const extracted = _.map(data, row => _.pullAt(row, indexes));
    return extracted;
}

module.exports = function loadCSVPercentage(
    filename,
    characterSplit,
    {
        dataColumns = [],     // COLUMNAS DE ENTRADA
        labelColumns = [],    // COLUMNA DE SALIDA
        shuffle = true,       // MEZCLAR VALORES
        percentageTest = 0,   // PORCENTAJE DE TEST
        converters = {}       // CONVERSIONES
    }
) {
    // LEER CSV
    let data = fs.readFileSync(filename, { encoding: 'utf-8' });

    // DIVIDIR POR FILAS Y COLUMNAS
    data = data.split('\n').map(row => row.split(characterSplit));

    // ELIMINAR CAMPOS VACÍOS
    data = data.map(row => _.dropRightWhile(row, val => val === ''));

    // ELIMINAR '\r' DE CADENAS
    data = data.map(row => row.map(column => extractCharacter(column, /\r/g, '')));

    // ELIMINAR COMILLAS DE COLUMNA
    for (let i = 0; i < data[0].length; i++) {
        data[0][i] = stripQuotes(data[0][i]);
    }

    const headers = _.first(data);

    // CONVERTIR Y PARSEAR DATOS
    data = data.map((row, index) => {
        if (index === 0) return row;

        return row.map((element, index) => {
            if (converters[headers[index]]) {
                const converted = converters[headers[index]](element);
                return _.isNaN(converted) ? element : converted;
            }

            const result = parseFloat(element);
            return _.isNaN(result) ? element : result;
        });
    });

    // SEPARAR ETIQUETAS Y CARACTERÍSTICAS
    let labels = extractColumns(data, labelColumns);
    data = extractColumns(data, dataColumns);

    // ELIMINAR NOMBRES DE COLUMNA
    labels.shift();
    data.shift();

    // MEZCLAR SI ES NECESARIO
    if (shuffle) {
        data = shuffleSeed.shuffle(data, 'phrase');
        labels = shuffleSeed.shuffle(labels, 'phrase');
    }

    // DIVIDIR EN ENTRENAMIENTO Y TEST
    if (percentageTest && _.isNumber(percentageTest)) {
        if (percentageTest > 99) throw new Error("! ERROR: ALL VALUES CANNOT BE USED FOR TESTING !");
        else if (percentageTest < 0) percentageTest = 0;

        const trainSize = Math.floor(data.length * ((100 - percentageTest) / 100));

        return {
            features: data.slice(0, trainSize),
            labels: labels.slice(0, trainSize),
            testFeatures: data.slice(trainSize),
            testLabels: labels.slice(trainSize),
        };
    }
    // SI NO HAY TEST, DEVOLVER SÓLO DATOS DE ENTRENAMIENTO
    else {
        return { features: data, labels };
    }
};
