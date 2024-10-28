const tf = require('@tensorflow/tfjs'); 

// CLASE PARA ALGORITMO DE REDES NEURONALES
class RedNeuronal2 {

    // DATOS (FEATURES), RESULTADOS (LABELS), OPCIONES, CAPA DE ENTRADA, CAPAS OCULTAS, CAPA DE SALIDA
    constructor(features, labels, options, inputLayer, hiddenLayers, outputLayer) {
        this.features = tf.tensor(features);  // DECLARA FEATURES
        this.labels = tf.tensor(labels);      // DECLARA LABELS
        this.model = tf.sequential();         // DECLARA MODELO
        this.options = Object.assign({ epochs: 2000, learningRate: 0.1 }, options);  // OPCIONES
        this.inputLayer = Object.assign({ neurons: 1, activation: 'relu' }, inputLayer);  // ENTRADA
        this.hiddenLayers = hiddenLayers;     // CAPAS OCULTAS
        this.outputLayer = Object.assign({ neurons: 1, activation: 'relu' }, outputLayer);  // SALIDA
    };

    // COMPILA EL ALGORITMO
    compilar() {
        const inputLayer = tf.layers.dense({
            units: this.inputLayer.neurons,
            inputShape: [this.features.shape[1]],
            activation: this.inputLayer.activation
        });
        this.model.add(inputLayer);  // AÑADE CAPA DE ENTRADA

        // AÑADE CAPAS OCULTAS
        this.hiddenLayers.forEach(layer => {
            const hiddenLayer = tf.layers.dense({
                units: layer.neurons,
                activation: layer.activation
            });
            this.model.add(hiddenLayer);
        });

        const outputLayer = tf.layers.dense({
            units: this.outputLayer.neurons,
            activation: this.outputLayer.activation
        });
        this.model.add(outputLayer);  // AÑADE CAPA DE SALIDA

        // COMPILA EL MODELO
        this.model.compile({
            optimizer: tf.train.adam(this.options.learningRate),
            loss: tf.losses.meanSquaredError
        });
    };

    // ENTRENAR EL ALGORITMO
    async entrenar() {
        console.log('[ TRAINING... ]');  // SALIDA: ENTRENANDO
        return await this.model.fit(this.features, this.labels, { epochs: this.options.epochs, verbose: 0 });
    };

    // HACER PREDICCIONES
    prediccion(features) {
        features = tf.tensor(features);
        return this.model.predict(features);
    };

    // PROBAR EFICACIA DEL MODELO
    testeo(testFeatures, testLabels) {
        testFeatures = tf.tensor(testFeatures);
        testLabels = tf.tensor(testLabels);

        const resultado = this.model.predict(testFeatures);  // HACER PREDICCIONES
        const res = testLabels.sub(resultado).pow(2).sum().get();  // CALCULAR ERROR
        const tot = testLabels.sub(testLabels.mean()).pow(2).sum().get();  // CALCULAR MEDIA

        // RETORNAR RESULTADO
        return 1 - res / tot;
    };
}

module.exports = RedNeuronal2; 
