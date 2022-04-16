const util = require('util');
const spawn = require('child_process').spawn;
const exec = util.promisify(require('child_process').exec);
const ws = require('ws');
const express = require('express');
const fs = require('fs');
const path = require('path');

const PORT = 5100;
const WS_PORT = 5101;
const PS_CMD = `ps -A`;
const PROCESS_NAME = `overviewer.py`;
const LOG_FILE = './public/overviewer.log';

const wss = new ws.Server({port: WS_PORT});
const app = express();

wss.on('connection', async wsc => {
	if (await isRunning()) {
		wsc.send(JSON.stringify({action: 'UP'}));
	} else {
		wsc.send(JSON.stringify({action: 'DOWN'}));
	}

	wsc.on('message', async message => {
		const data = message.toString();

		switch (data) {
			case '[[RUN]]':
				run(wsc);
				wsc.send(JSON.stringify({action: 'UP'}));
				break;
		}

	});

});

app.use(express.static(path.resolve(__dirname, 'public')));

app.listen(PORT)

async function run(wsc) {
	if (await isRunning()) return null;
	wss.clients.forEach(client => {
		client.send(JSON.stringify({action: 'RUN'}));
	});

	fs.writeFileSync(path.resolve(__dirname, LOG_FILE), '');

	const overviwer = spawn('/usr/bin/overviewer.py', ['-c', '/etc/overviewer/overviewer.conf']);

	overviwer.stdout.on('data', data => {
		const out = data.toString();
		console.log(out);
		fs.appendFile(path.resolve(__dirname, LOG_FILE), out, error => {
			if (error) console.error(error);
		});

		wss.clients.forEach(client => {
			client.send(JSON.stringify({action: 'OUT', out: out}));
		});
	});

	overviwer.stderr.on('data', data => {
		const error = data.toString();
		console.error(`Error: ${error}`);
		wsc.send(JSON.stringify({action: 'ERROR', error: error}));
	});

	overviwer.on('close', (code) => {
		wss.clients.forEach(client => {
			client.send(JSON.stringify({action: 'DOWN'}));
		});
	});
}

async function isRunning() {
	const { stdout } = await exec(PS_CMD);
	const running = stdout.toLowerCase().indexOf(PROCESS_NAME.toLowerCase()) > -1;
	return running;
}
