import dgram from 'dgram';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import parser  from 'nsyslog-parser';
import os from 'os';

const server = dgram.createSocket('udp4');

// Obtener la ruta del archivo actual
const __filename = fileURLToPath(import.meta.url);
// Ruta del archivo de log
const __dirname = path.dirname(__filename);
const LOG_FILE_PATH = path.join(__dirname, 'logs/syslog.log');
const MAX_LOG_SIZE = 10 * 1024; // 10 KB
const LOGGING_ENABLED = true;

async function saveLogMessage(message) {
    if (!LOGGING_ENABLED) return;

    try {
        await fs.ensureDir(path.dirname(LOG_FILE_PATH));
        if (!await fs.pathExists(LOG_FILE_PATH)) {
            await fs.writeFile(LOG_FILE_PATH, '');
        }

        const logData = await fs.readFile(LOG_FILE_PATH, 'utf-8');
        const logLines = logData.split('\n').filter(line => line.trim().length > 0);
        logLines.push(message);

        let newLogContent = logLines.join('\n') + '\n';
        while (Buffer.byteLength(newLogContent, 'utf-8') > MAX_LOG_SIZE) {
            logLines.shift(); // Eliminar la primera línea si el tamaño excede el límite
            newLogContent = logLines.join('\n') + '\n';
        }

        await fs.writeFile(LOG_FILE_PATH, newLogContent);
    } catch (error) {
        console.error('Error logging message:', error);
    }
}
function getLocalIPAddresses() {
    const interfaces = os.networkInterfaces();
    const ipAddresses = [];

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                ipAddresses.push({ name, address: iface.address });
            }
        }
    }

    return ipAddresses;
}

const PORT = 5140;
const HOST = '0.0.0.0';

console.log('Iniciando servidor Syslog...');

const logLevels = {
    0: 'EMERGENCY'.red,
    1: 'ALERT'.red,
    2: 'CRITICAL'.red,
    3: 'ERROR'.red,
    4: 'WARNING'.yellow,
    5: 'NOTICE'.blue,
    6: 'INFO'.green,
    7: 'DEBUG'.gray,
};

function formatSyslog(parsed) {
    return `${parsed.pri} ${parsed.version} ${parsed.ts.toISOString()} ${parsed.host} ${parsed.appName} ${parsed.pid} ${parsed.messageid} ${parsed.structuredData.join(' ')} ${parsed.message}`;
}
function levelBadge(level) {
    //const level = chalk.bgBlue.white(`[${logObj.level.toUpperCase()}]`); // Nivel en fondo azul y texto blanco
    //Definir el color del nivel de log
    switch (level) {
        case 'debug':
            return chalk.bgGreen.white('[DEBUG]');
        case 'info':
            return chalk.bgBlue.white('[INFO]');
        case 'notice':
            return chalk.bgCyan.white('[NOTICE]');
        case 'warning':
            return chalk.bgYellow.white('[WARNING]');
        case 'error':
            return chalk.bgRed.white('[ERROR]');
        case 'crit':
            return chalk.bgRed.white('[CRITICAL]');
        case 'alert':
            return chalk.bgRed.white('[ALERT]');
        case 'emerg':
            return chalk.bgRed.white('[EMERGENCY]');
        default:
            return chalk.bgWhite.black(`[${level.toUpperCase()}]`);
    }
}

function formatLogEntryForLogfile(logObj) {
    const isoDate = new Date(logObj.ts).toISOString(); // Fecha en formato ISO
    const level = `[${logObj.level.toUpperCase()}]`; // Nivel de log en mayúsculas
    const host = logObj.host; // Host
    const appName = logObj.appName; // Nombre de la aplicación
    const message = logObj.message; // Mensaje

    return `${isoDate} ${level} ${host} (${appName}): ${message}`;
}

function formatLogEntryForConsole(logObj) {
    const isoDate = new Date(logObj.ts).toISOString(); // Fecha en formato ISO
    const timestamp = chalk.cyan(isoDate); // Fecha en cian
    const level = levelBadge(logObj.level);
    const host = chalk.magenta(logObj.host); // Host en magenta
    const appName = chalk.yellow(logObj.appName); // Nombre de la aplicación en amarillo
    const message = chalk.white(logObj.message); // Mensaje en blanco

    // Composición del mensaje formateado
    return `${timestamp} ${level} ${host} (${appName}): ${message}`;
}

server.on('message', (msg, rinfo) => {
    const rawMessage = msg.toString();
    const parsedMessage = parser(rawMessage);
    const formattedLogEntry = formatLogEntryForLogfile(parsedMessage);
    const formattedConsoleEntry = formatLogEntryForConsole(parsedMessage);
    console.log(formattedConsoleEntry);
    saveLogMessage(formattedLogEntry);
});

server.on('error', (err) => {
    console.error(`Error: ${err.message}`);
});

server.bind(PORT, HOST, () => {

    const asciiArt = `
  ██████▓██   ██▓  ██████  ██▓     ▒█████    ▄████      ██████  ██▀███   ██▒   █▓
▒██    ▒ ▒██  ██▒▒██    ▒ ▓██▒    ▒██▒  ██▒ ██▒ ▀█▒   ▒██    ▒ ▓██ ▒ ██▒▓██░   █▒
░ ▓██▄    ▒██ ██░░ ▓██▄   ▒██░    ▒██░  ██▒▒██░▄▄▄░   ░ ▓██▄   ▓██ ░▄█ ▒ ▓██  █▒░
  ▒   ██▒ ░ ▐██▓░  ▒   ██▒▒██░    ▒██   ██░░▓█  ██▓     ▒   ██▒▒██▀▀█▄    ▒██ █░░
▒██████▒▒ ░ ██▒▓░▒██████▒▒░██████▒░ ████▓▒░░▒▓███▀▒   ▒██████▒▒░██▓ ▒██▒   ▒▀█░  
▒ ▒▓▒ ▒ ░  ██▒▒▒ ▒ ▒▓▒ ▒ ░░ ▒░▓  ░░ ▒░▒░▒░  ░▒   ▒    ▒ ▒▓▒ ▒ ░░ ▒▓ ░▒▓░   ░ ▐░  
░ ░▒  ░ ░▓██ ░▒░ ░ ░▒  ░ ░░ ░ ▒  ░  ░ ▒ ▒░   ░   ░    ░ ░▒  ░ ░  ░▒ ░ ▒░   ░ ░░  
░  ░  ░  ▒ ▒ ░░  ░  ░  ░    ░ ░   ░ ░ ░ ▒  ░ ░   ░    ░  ░  ░    ░░   ░      ░░  
      ░  ░ ░           ░      ░  ░    ░ ░        ░          ░     ░           ░  
         ░ ░                                                                 ░   
`.replace(/▄/g, chalk.green('▄')).replace(/█/g, chalk.green('█')).replace(/▒/g, chalk.red('▒')).replace(/░/g, chalk.red('░')).replace(/▓/g, chalk.green('▓')).replace(/▐/g, chalk.green('▐')).replace(/▓/g, chalk.green('▓')).replace(/▀/g, chalk.green('▀'));

    console.log(asciiArt);
    console.log(chalk.white(`Logueo de mensajes ${LOGGING_ENABLED ? chalk.green('ACTIVADO') : chalk.red('DESACTIVADO')}`));
    
    if (LOGGING_ENABLED) {
        console.log(chalk.white(`Logueando mensajes en ${LOG_FILE_PATH}`));
        console.log(chalk.magenta(`Tamaño máximo de log: ${chalk.yellow(MAX_LOG_SIZE)} bytes`));
        
        const logSize = fs.existsSync(LOG_FILE_PATH) ? fs.statSync(LOG_FILE_PATH).size : 0;
        console.log(chalk.green(`Tamaño actual de log: ${chalk.yellow(logSize)} bytes`));
        
        const freeSpace = Math.floor((MAX_LOG_SIZE - logSize) / 1024);
        console.log(chalk.green(`Espacio libre para log: ${chalk.yellow(freeSpace)} KB`));
    }
    
    //console.log(chalk.cyan(`Servidor Syslog escuchando en ${HOST}:${PORT}`));

    const localIPs = getLocalIPAddresses();

    console.log();
    console.log(chalk.green(`Hosts locales:`));
    const localHosts = localIPs.map(iface => iface.address);
    console.log(chalk.cyan("[ " + chalk.white(localHosts.join(chalk.white(', '))) + " ]"));
    console.log();
    console.log(chalk.green(`Servidor Syslog escuchando en todas las interfaces en el puerto ${chalk.yellow(PORT)}`));

    console.log(chalk.white(`Presiona ${chalk.yellow('Ctrl + C')} para detener el servidor`));
    console.log();
});
