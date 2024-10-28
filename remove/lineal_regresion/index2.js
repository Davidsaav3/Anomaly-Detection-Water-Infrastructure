require('@tensorflow/tfjs-node');
const tf = require('@tensorflow/tfjs');
const loadCSV = require('./load');
const pathCSV = '../../dataset/';

// CARGAR DATOS CSV
const { features, labels, testFeatures, testLabels } = loadCSV(
    `${pathCSV}add.csv`, // RUTA DEL CSV
    ',',
    {
        shuffle: true,
        splitTest: 9,
        dataColumns: ['end_device_ids.application_ids.application_id', 'end_device_ids.dev_eui', 'end_device_ids.join_eui', 'end_device_ids.dev_addr', 'correlation_ids_0', 'received_at', 'uplink_message.session_key_id', 'uplink_message.f_port', 'uplink_message.f_cnt', 'uplink_message.frm_payload', 'uplink_message.decoded_payload.bytes_0', 'uplink_message.decoded_payload.bytes_1', 'uplink_message.decoded_payload.bytes_2', 'uplink_message.decoded_payload.bytes_3', 'uplink_message.rx_metadata_0.gateway_ids.gateway_id', 'uplink_message.rx_metadata_0.gateway_ids.eui', 'uplink_message.rx_metadata_0.time', 'uplink_message.rx_metadata_0.timestamp', 'uplink_message.rx_metadata_0.rssi', 'uplink_message.rx_metadata_0.channel_rssi', 'uplink_message.rx_metadata_0.location.latitude', 'uplink_message.rx_metadata_0.location.longitude', 'uplink_message.rx_metadata_0.location.altitude', 'uplink_message.rx_metadata_0.location.source', 'uplink_message.rx_metadata_0.uplink_token', 'uplink_message.rx_metadata_0.received_at', 'uplink_message.settings.data_rate.lora.bandwidth', 'uplink_message.settings.data_rate.lora.spreading_factor', 'uplink_message.settings.data_rate.lora.coding_rate', 'uplink_message.settings.frequency', 'uplink_message.settings.timestamp', 'uplink_message.settings.time', 'uplink_message.received_at', 'uplink_message.consumed_airtime', 'uplink_message.network_ids.net_id', 'uplink_message.network_ids.ns_id', 'uplink_message.network_ids.tenant_id', 'uplink_message.network_ids.cluster_id', 'uplink_message.network_ids.cluster_address', 'truth'], // COLUMNAS DE DATOS
        labelColumns: ['end_device_ids.device_id'] // COLUMNAS DE ETIQUETAS
    }
);

/*
const { features, labels, testFeatures, testLabels } = loadCSV(
    `${pathCSV}datos-marzo-horas.csv`,
    ',',
    {
        shuffle: true,
        splitTest: 22,
        dataColumns: ['dia', '0-24'],
        labelColumns: ['value']
    }
);
*/

// MOSTRAR CARACTERÍSTICAS Y ETIQUETAS
console.log("[ FEATURES: ", features);
console.log("[ LABELS: ", labels);

let x_vals = tf.tensor(features);
let y_vals = tf.tensor(labels);

// AJUSTAR DIMENSIÓN DE W
let w = tf.variable(tf.zeros([x_vals.shape[1], 1])); // Ajustar para que coincida con las características
console.log("[ W VALUES: ");
w.print();
let b = tf.variable(tf.scalar(0));

let learningRate = 0.002;

// IMPRIMIR VALORES INICIALES
x_vals.print();
y_vals.print();
w.print();
b.print();

// FUNCIÓN DE PÉRDIDA
function loss(predictions, auxLabels) {
    let error = predictions.sub(auxLabels).square().mean();
    return error;
}

// FUNCIÓN DE PREDICCIÓN
function predict(x, w, b) {
    // USAR matMul PARA MULTIPLICACIÓN DE MATRICES
    let y_hat = x.matMul(w).add(b); // Corregido para usar matMul
    return y_hat;
}

// FUNCIÓN DE ENTRENAMIENTO
function train(x, y, w, b, i) {
    let optimizer = tf.train.sgd(learningRate);
    
    optimizer.minimize(function () {
        let pred = predict(x, w, b);
        let stepLoss = loss(pred, y);

        console.log(" ");
        console.log("[ ITERATION: ", i);
        w.print();
        b.print();
        console.log(" ");

        return stepLoss;
    });
}

// ENTRENAMIENTO DEL MODELO
for (let i = 0; i < 10; i++) {
    train(x_vals, y_vals, w, b, i);
}

// MOSTRAR RESULTADOS FINALES
console.log("[ FINAL W: ");
w.print();
console.log("[ FINAL B: ");
b.print();

// PRUEBA
console.log('[ TEST ]');
console.log('[ DATA =>', features[1]);
console.log('[ ACTUAL RESULT =>', labels[1]);
const resultado = predict(tf.tensor([features[1]]), w, b); // Asegúrate de que sea una tensor 2D
console.log('[ PREDICTION RESULT =>', resultado.sum().get());

// ERROR
console.log("! ERROR: ", labels[1] - resultado.sum().get());

let porcentaje = labels[1] / resultado.sum().get();
if (porcentaje > 1) {
    let error = porcentaje - 1;
    porcentaje = 1 - error;
}

console.log("[ % CLOSENESS:", porcentaje);
