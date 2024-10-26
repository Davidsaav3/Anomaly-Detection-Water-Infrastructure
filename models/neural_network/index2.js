require('@tensorflow/tfjs-node'); 
const tf = require('@tensorflow/tfjs');
const loadCSVPercentage = require('./load.js');
const RedNeuronal2 = require('./network2.js');
const { forEach } = require('lodash');
const pathCSV = '../../dataset/data/';

// CARGAR CSV
const { features, labels, testFeatures, testLabels } = loadCSVPercentage(
    `${pathCSV}energia-enero-7dias.csv`,
    ',',
    {
        shuffle: true,             // MEZCLAR DATOS
        percentageTest: 20,        // PORCENTAJE PARA TEST
        dataColumns: ['dia de la semana', '0-24'],  // COLUMNAS INPUT
        labelColumns: ['value']    // COLUMNA OUTPUT
    }
);

// CREAR CLASE MODELO PARA ALMACENAR DATOS DE LA RED
function Model(model, activation, error, resultado) {
    this.model = model;
    this.activation = activation;
    this.error = error;
    this.resultado = resultado;
}

let models = []; // ARRAY PARA ALMACENAR MODELOS ENTRENADOS

// LISTA DE FUNCIONES DE ACTIVACIÓN
const activations = ['linear', 'sigmoid', 'tanh', 'relu'];

// FUNCIÓN ASÍNCRONA PARA CREAR Y ENTRENAR MÚLTIPLES REDES NEURONALES
async function crearRedes2() {
    // CREAR RED PARA CADA ACTIVACIÓN
    for (const typeActivation of activations) {
        const redneuronal = new RedNeuronal2(
            features,
            labels,
            {
                learningRate: 0.1,  // TASA DE APRENDIZAJE
                epochs: 2000,       // NÚMERO DE ÉPOCAS
                neurons: 10,        // NÚMERO DE NEURONAS
                activation: typeActivation  // FUNCIÓN DE ACTIVACIÓN
            }
        );

        redneuronal.compilar();  // COMPILAR MODELO
        const history = await redneuronal.entrenar();  // ENTRENAR MODELO
        const porcentaje = redneuronal.testeo(testFeatures, testLabels);  // TESTEAR MODELO

        // GUARDAR MODELO, FUNCIÓN DE ACTIVACIÓN, ERROR Y RESULTADO
        models.push(new Model(redneuronal, typeActivation, history.history.loss[history.history.loss.length - 1], porcentaje));
    }

    // ORDENAR MODELOS POR RESULTADO
    models.sort((a, b) => b.resultado - a.resultado);

    // IMPRIMIR DATOS DE CADA MODELO
    models.forEach(model => {
        console.log("[ ]"); 
        console.log("[ ACTIVATION: ", model.activation); 
        console.log("[ ERROR: ", model.error); 
        console.log("[ RESULT: ", model.resultado); 
    });

    // IMPRIMIR PREDICCIONES
    console.log("[ PREDICTIONS ]"); 
    models.forEach(element => {
        const resultado = element.model.prediccion(features);
        console.log("[ REAL: ", labels); 
        console.log("[ PREDICTION: "); 
        resultado.print();
    });
}

crearRedes2();  // LLAMAR FUNCIÓN PARA CREAR REDES NEURONALES

// CREAR RED NEURONAL INDIVIDUAL PARA PRUEBAS
const redneuronalPrueba = new RedNeuronal2(
    features,  // VARIABLES INDEPENDIENTES
    labels,    // VARIABLES DEPENDIENTES
    // CONFIGURACIÓN GENERAL
    {
        learningRate: 0.001,  // TASA DE APRENDIZAJE
        epochs: 50            // NÚMERO DE ÉPOCAS
    },
    // CONFIGURACIÓN CAPA DE ENTRADA
    {
        neurons: 1,           // NÚMERO DE NEURONAS
        activation: 'relu'    // FUNCIÓN DE ACTIVACIÓN
    },
    // CAPAS INTERMEDIAS
    [
        {
            neurons: 32,      // NÚMERO DE NEURONAS
            activation: 'relu' // FUNCIÓN DE ACTIVACIÓN
        },
        {
            neurons: 16,      // NÚMERO DE NEURONAS
            activation: 'relu' // FUNCIÓN DE ACTIVACIÓN
        }
    ],
    // CONFIGURACIÓN CAPA DE SALIDA
    {
        neurons: 1,           // NÚMERO DE NEURONAS
        activation: 'linear'  // FUNCIÓN DE ACTIVACIÓN
    }
);
