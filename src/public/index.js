
(() => {
	const log = document.querySelector('.log');
	const mapUrl = document.querySelector('.map-url');
	const runButton = document.querySelector('.run-button');
	const clearLogButton = document.querySelector('.clear-log-button');

	clearLogButton.addEventListener('click', clearLog);

	fetch('./overviewer.log')
		.then(data => data.text())
		.then(text => text.split('\n').forEach(appendOutput));

	connect();

	function connect() {
		const socket = new WebSocket('wss://ws.overviewer.hochburg.devlysh.com');

		socket.addEventListener('open', onOpen);
		socket.addEventListener('close', onClose);
		socket.addEventListener('error', onError);
		socket.addEventListener('message', onMessage);

		function onOpen(event) {
			runButton.addEventListener('click', runWithSocket);
			enableForm();
			console.log(`Socket is open.`);
		}

		function onClose(event) {
			runButton.removeEventListener('click', () => runWithSocket);
			disableForm();
			console.log(`Socket is closed. Reconnect will be attemped in 1 second. ${event.reason}`);
			setTimeout(connect, 1000);
		}

		function onError(error) {
			console.error(`Socket encountered error: ${JSON.stringify(error)}. Closing socket`);
			socket.close();
		}

		function onMessage(event) {
			const data = JSON.parse(event.data);

			if (!data.status) return;
			switch (data.status) {
				case 'UP':
					disableForm();	
					break;
				case 'DOWN':
					enableForm();	
					break;
				case 'OUT':
					appendOutput(data.out);
					break;
				case 'ERROR':
					appendError(data.error);
					break;
			}
		}

		function runWithSocket() {
			run(socket);
		}
	}


	function run(socket) {
		clearLog();
		socket.send('[[RUN]]');
	}

	function clearLog() {
		log.innerHTML = '';
	}

	function appendOutput(data) {
		const p = document.createElement('p');
		p.append(data);
		log.appendChild(p);
	}

	function appendError(data) {
		const p = document.createElement('p');
		p.classList.add('error');
		p.append(data);
		log.appendChild(p);
	}

	function enableForm() {
		runButton.disabled = false;
		mapUrl.classList.remove('disabled');
	}

	function disableForm() {
		runButton.disabled = true;
		mapUrl.classList.add('disabled');
	}
})();
