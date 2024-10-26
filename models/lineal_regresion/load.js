const fs = require('fs');
const _ = require('lodash');
const shuffleSeed = require('shuffle-seed');

// QUITAR COMILLAS DOBLES
function stripQuotes(columnName) {
    return columnName.replace(/^"(.*)"$/, '$1');
}

// QUITAR CARACTERES CON REGEX
function extractCharacter(columnName, regular, characterReplace) {
    return columnName.replace(regular, characterReplace);
}

// EXTRAER VALORES Y DIVIDIR
function extractColumns(data, columnNames) {
    const headers = _.first(data);
    const indexes = _.map(columnNames, column => headers.indexOf(column));
    const extracted = _.map(data, row => _.pullAt(row, indexes));
    return extracted;
}

module.exports = function loadCSV(
    filename, 
    characterSplit,
    {
        dataColumns     = [],   // COLUMNAS DE ENTRADA
        labelColumns    = [],   // COLUMNA A PREDICIR
        shuffle         = true, // MEZCLAR VALORES
        splitTest       = 0,    // DIVISIÓN DE TEST
        converters      = {}    // CONVERSIONES
    } 
) {
    
    // LEER ARCHIVO CSV
    let data = fs.readFileSync(filename, { encoding: 'utf-8' });
    
    // DIVIDIR EN FILAS Y COLUMNAS
    data = data.split('\n').map(row => row.split(characterSplit));

    // QUITAR VACÍOS AL FINAL
    data = data.map(row => _.dropRightWhile(row, val => val === ''));

    // QUITAR \r
    data = data.map((row) => {
        return row.map(column => extractCharacter(column, /\r/g, ''));
    });

    // QUITAR COMILLAS
    for (let i = 0; i < data[0].length; i++) {
        data[0][i] = stripQuotes(data[0][i]);
    }

    const headers = _.first(data);

    data = data.map((row, index) => {
        if (index === 0) return row; // IGNORAR PRIMERA FILA

        return row.map((element, index) => {
            // APLICAR CONVERSIONES
            if (converters[headers[index]]) {
                const converted = converters[headers[index]](element);
                return _.isNaN(converted) ? element : converted;
            }

            const result = parseFloat(element); // CONVERTIR A NÚMERO
            return _.isNaN(result) ? element : result; 
        });
    });

    // SEPARAR ETIQUETAS Y CARACTERÍSTICAS
    let labels = extractColumns(data, labelColumns);
    data = extractColumns(data, dataColumns);

    // QUITAR NOMBRES DE COLUMNAS
    labels.shift();
    data.shift();

    // MEZCLAR SI SE INDICA
    if (shuffle) {
        data = shuffleSeed.shuffle(data, 'phrase'); 
        labels = shuffleSeed.shuffle(labels, 'phrase');
    }

    // DIVIDIR EN ENTRENAMIENTO Y TEST
    if (splitTest) {
        const trainSize = _.isNumber(splitTest) ? splitTest : Math.floor(data.length / 2);

        return {
            features:       data.slice(0, trainSize),
            labels:         labels.slice(0, trainSize),
            testFeatures:   data.slice(trainSize),
            testLabels:     labels.slice(trainSize),
        };
    } 
    else {
        return { features: data, labels };
    }
};
