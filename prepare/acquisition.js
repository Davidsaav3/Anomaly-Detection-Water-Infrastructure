const fs = require('fs');
const mqtt = require('mqtt');
const path = require('path');

// OBTENER PARÁMETROS DE LA LÍNEA DE COMANDOS
const args = process.argv.slice(2);
const configPath = args[1] ? args[1] : './config.json';

let config = {};

// CARGAR CONFIGURACIÓN DESDE EL ARCHIVO JSON (O USAR VALORES POR DEFECTO)
try {
  const configFile = fs.readFileSync(configPath);
  config = JSON.parse(configFile);
} 
catch (error) {
  console.error(`! ERROR: NO SE PUDO LEER ${configPath}, USANDO CONFIGURACIÓN POR DEFECTO !`, error);
  process.exit(1); // SALIR SI NO SE PUEDE LEER EL ARCHIVO DE CONFIGURACIÓN
}

const outputFileName = args[0] ? `${config.default.dataset}${args[0]}.json` : `${config.default.dataset}dataset_${new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14)}_acquisition.json`;
let messages = [];

// VERIFICAR Y CREAR DIRECTORIO SI NO EXISTE
const ensureDirectoryExistence = (filePath) => {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) fs.mkdirSync(dirname, { recursive: true });
};

// CONECTAR Y MANEJAR RECEPCIÓN DE MENSAJES
const getConnections = async () => {
  try {
    // CONECTAR AL BROKER MQTT USANDO LA CONFIGURACIÓN DEL ARCHIVO JSON
    const client = mqtt.connect(config.acquisition.mqttQeue, {
      username: config.acquisition.appID,
      password: config.acquisition.accesKey
    });

    // MANEJO DE CONEXIÓN
    client.on('connect', () => {
      console.log("[ CONECTADO A MQTT ]");
      client.subscribe(config.acquisition.subscribe); // SUSCRIBIRSE AL TEMA
    });

    // MANEJO DE MENSAJES RECIBIDOS
    client.on('message', async (topic, message) => {
      try {
        const jsonMessage = JSON.parse(message.toString()); // PARSEAR MENSAJE A JSON
        if (jsonMessage && typeof jsonMessage === 'object') { // VERIFICAR JSON VÁLIDO
          messages.push(jsonMessage); // AGREGAR MENSAJE AL ARRAY
          ensureDirectoryExistence(outputFileName); // VERIFICAR QUE EL DIRECTORIO EXISTA
          fs.writeFileSync(outputFileName, JSON.stringify(messages, null, 2)); // GUARDAR MENSAJES
          console.log(`[ TOTAL: ${messages.length} ]`);
        }
      } 
      catch (error) {
        console.error('! ERROR: MESSAGE! ', error);
      }
    });
  } 
  catch (error) {
    console.error('! ERROR: CONNECTION ! ', error);
  }
};

getConnections();
