exports.install = function() {

	ROUTE('+SOCKET  /', socket, 1024);
	ROUTE('+GET     /', http, ['sse'], 1024);

	// Sync
	ROUTE('GET      /sync/{channel}/', sync);
	ROUTE('PATCH    /sync/{channel}/', sync, 1024 * 2);
	ROUTE('POST     /sync/{channel}/', sync, 1024 * 2);
	ROUTE('POST     /sync/{channel}/', sync, ['upload'], 1024 * 50);
	ROUTE('PUT      /sync/{channel}/', sync, 1024 * 2);
	ROUTE('PUT      /sync/{channel}/', sync, ['upload'], 1024 * 50);
	ROUTE('DELETE   /sync/{channel}/', sync, 1024 * 2);

	// Index
	ROUTE('GET /', index);

	// Files
	ROUTE('FILE /download/*.dat', download);
};

function index() {
	if (PREF.token)
		this.plain('OpenSync v' + MAIN.version);
	else
		this.redirect('/setup/');
}

function sync(channel) {

	var self = this;
	var client = null;
	var data = {};

	data.id = UID();
	data.channel = channel;
	data.method = self.req.method;
	data.headers = self.headers;
	data.ua = self.ua;
	data.query = self.query;
	data.body = self.body;
	data.ts = new Date();
	data.ip = self.ip;
	data.files = [];

	var url = self.hostname('/');

	for (var file of self.files) {
		var fileid = HASH(file.path).toString(36);
		var tmp = {};
		tmp.name = file.name;
		tmp.filename = file.filename;
		tmp.extension = file.extension;
		tmp.type = file.type;
		tmp.size = file.size;
		tmp.width = file.width;
		tmp.height = file.height;
		tmp.url = url + 'download/' + fileid + '.dat';
		MAIN.files[fileid] = file;
		data.files.push(tmp);
		file.expire = NOW.add('1 hour');
	}

	self.autoclear(false);
	self.empty();

	F.$events.sync && EMIT('sync', data);

	if (MAIN.socket) {
		for (var key in MAIN.socket.connections) {
			client = MAIN.socket.connections[key];
			if (!client.user.channels || client.user.channels[channel]) {
				client.send(data);
				stats(client.user);
			}
		}
	}

	for (client of MAIN.sse) {
		if (!client.user.channels || client.user.channels[channel]) {
			client.sse(data);
			stats(client.user);
		}
	}

	if (CONF.allow_tms && F.tms.publish_cache.sync && F.tms.publishers.sync)
		PUBLISH('sync', data);

}

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

function socket() {
	var self = this;
	MAIN.socket = self;
	self.on('open', function(client) {
		client.send({ type: 'init', name: PREF.name, version: MAIN.version, id: 'OpenSync' });
	});
}

function download(req, res) {
	var id = req.split[1].replace(/\.dat$/, '');
	var file = MAIN.files[id];
	if (file)
		res.file(file.path, file.filename);
	else
		res.throw404();
}

function http() {

	var self = this;

	self.sse({ type: 'init', name: PREF.name, version: MAIN.version, id: 'OpenSync' });
	self.res.on('close', function() {
		var index = MAIN.sse.indexOf(self);
		MAIN.sse.splice(index, 1);
	});

	MAIN.sse.push(self);
}

ON('service', function(counter) {
	if (counter % 10 === 0) {
		var remove = [];
		for (var key in MAIN.files) {
			var file = MAIN.files[key];
			if (file.expire < NOW) {
				remove.push(file.path);
				delete MAIN.files[key];
			}
		}
		PATH.unlink(remove);
	}
});