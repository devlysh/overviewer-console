
(() => {
	fetch('./overviewer.log')
		.then(data => data.text())
		.then(data => {
			const lines = data.split('\n');
			lines.forEach(appendOutput);
		});
	const socket = new WebSocket('wss://ws.overviewer.hochburg.devlysh.com');
	const log = document.querySelector('.log');
	const mapUrl = document.querySelector('.map-url');
	const runButton = document.querySelector('.run-button');
	const clearLogButton = document.querySelector('.clear-log-button');

	socket.addEventListener('open', event => {
		clearLogButton.addEventListener('click', clearLog);
		runButton.addEventListener('click', run);
	});

	socket.addEventListener('message', event => {
		const data = JSON.parse(event.data);

		if (!data.status) return;
		switch (data.status) {
			case 'UP':
				disableButton();	
				break;
			case 'DOWN':
				enableButton();	
				break;
			case 'OUT':
				appendOutput(data.out);
				break;
			case 'ERROR':
				appendError(data.error);
				break;
		}
	});

	function run() {
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

	function enableButton() {
		runButton.disabled = false;
		mapUrl.classList.remove('disabled');
	}

	function disableButton() {
		runButton.disabled = true;
		mapUrl.classList.add('disabled');
	}
})();
