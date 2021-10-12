exports.install = function() {

	ROUTE('+SOCKET  /', socket, 1024);
	ROUTE('+GET     /', http, ['sse'], 1024);

	// Sync
	ROUTE('GET      /sync/{channel}/', sync);
	ROUTE('PATCH    /sync/{channel}/', sync, ['raw'],    1024 * 2);
	ROUTE('POST     /sync/{channel}/', sync, ['raw'],    1024 * 2);
	ROUTE('POST     /sync/{channel}/', sync, ['upload'], 1024 * 50);
	ROUTE('PUT      /sync/{channel}/', sync, ['raw'],    1024 * 2);
	ROUTE('PUT      /sync/{channel}/', sync, ['upload'], 1024 * 50);
	ROUTE('DELETE   /sync/{channel}/', sync, ['raw'],    1024 * 2);

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

	var $ = this;
	var type = $.headers['content-type'] || '';
	var body = $.body instanceof Buffer ? $.body.toString('utf8') : '';

	if (body && type.indexOf('/json') !== -1)
		body = DEF.parsers.json(body);

	$.body = body;
	FUNC.notify(channel, this);
	this.empty();
}

function socket() {
	var self = this;
	MAIN.socket = self;

	self.sendmeta = function(client) {
		var msg = { type: 'init', name: PREF.name, version: MAIN.version, id: 'OpenSync' };
		if (client)
			client.send(msg);
		else
			self.send(msg);
	};

	self.on('open', function(client) {
		self.sendmeta(client);
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