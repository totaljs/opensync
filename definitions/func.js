FUNC.checksum = function(id) {
	var sum = 0;
	for (var i = 0; i < id.length; i++)
		sum += id.charCodeAt(i);
	return sum.toString(36);
};

FUNC.preparetokens = function() {
	MAIN.tokens = {};
	if (PREF.tokens) {
		for (var token of PREF.tokens) {

			var obj = CLONE(token);
			if (obj.channels && obj.channels.length) {
				var tmp = {};
				for (var db of obj.channels)
					tmp[db] = 1;
				obj.channels = tmp;
			} else
				obj.channels = null;

			MAIN.tokens[obj.token] = obj;
		}
	}

	if (MAIN.socket) {
		for (var key in MAIN.socket.connections) {
			var client = MAIN.socket.connections[key];
			if (client.user.token !== PREF.token) {
				var session = MAIN.tokens[client.user.token];
				if (session)
					client.user = session;
				else
					client.close(4001);
			}
		}
	}

	for (var client of MAIN.sse) {
		if (client.user.token !== PREF.token) {
			var session = MAIN.tokens[client.user.token];
			if (session)
				client.user = session;
			else
				client.close();
		}
	}
};

FUNC.send = function(data) {

	var client;

	if (MAIN.socket) {
		for (var key in MAIN.socket.connections) {
			client = MAIN.socket.connections[key];
			if (!client.user.channels || client.user.channels[data.channel]) {
				client.send(data);
				stats(client.user);
			}
		}
	}

	for (client of MAIN.sse) {
		if (!client.user.channels || client.user.channels[data.channel]) {
			client.sse(data);
			stats(client.user);
		}
	}
};

function stats(session) {

	if (!MAIN.stats[session.token])
		MAIN.stats[session.token] = { total: 0, today: 0 };

	if (MAIN.stats[session.token].total)
		MAIN.stats[session.token].total++;
	else
		MAIN.stats[session.token].total = 1;

	if (MAIN.stats[session.token].today)
		MAIN.stats[session.token].today++;
	else
		MAIN.stats[session.token].today = 1;

	MAIN.stats.save();
}

ON('ready', function() {
	PREF.name && LOADCONFIG({ name: PREF.name, allow_tms: PREF.allow_tms, secret_tms: PREF.secret_tms });
	FUNC.preparetokens();
});