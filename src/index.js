const util = require('util');
const spawn = require('child_process').spawn;
const exec = util.promisify(require('child_process').exec);
const ws = require('ws');
const express = require('express');
const fs = require('fs');

const PORT = 5100;
const WS_PORT = 5101;
const PS_CMD = `ps -A`;
const PROCESS_NAME = `overviewer.py`;
const LOG_FILE = './public/overviewer.log';

const wss = new ws.Server({port: WS_PORT});
const app = express();

wss.on('connection', async wsc => {
	if (await isRunning()) {
		wsc.send(JSON.stringify({status: 'UP'}));
	} else {
		wsc.send(JSON.stringify({status: 'DOWN'}));
	}

	wsc.on('message', async message => {
		const data = message.toString();

		switch (data) {
			case '[[RUN]]':
				wsc.send(JSON.stringify({status: 'UP'}));
				run(wsc);
				break;
		}

	});

});

app.use(express.static('public'));

app.listen(PORT)

async function run(wsc) {
	if (await isRunning()) return null;

	fs.writeFileSync(LOG_FILE, '');

	const overviwer = spawn('/usr/bin/overviewer.py', ['-c', '/etc/overviewer/overviewer.conf']);

	overviwer.stdout.on('data', data => {
		const out = data.toString();
		console.log(out);
		fs.appendFile(LOG_FILE, out, error => {
			if (error) console.error(error);
		});
		wsc.send(JSON.stringify({status: 'OUT', out: out}));
	});

	overviwer.stderr.on('data', data => {
		const error = data.toString();
		console.error(`Error: ${error}`);
		wsc.send(JSON.stringify({status: 'ERROR', error: error}));
	});

	overviwer.on('close', (code) => {
		wsc.send(JSON.stringify({status: 'DOWN'}));
	});
}

async function isRunning() {
	const { stdout } = await exec(PS_CMD);
	const running = stdout.toLowerCase().indexOf(PROCESS_NAME.toLowerCase()) > -1;
	return running;
}