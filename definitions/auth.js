var DDOS = {};

AUTH(function($) {

	if ($.path[0] === 'setup' || ($.path[0] === '/' || ($.websocket || $.headers.accept === 'text/event-stream'))) {

		if (DDOS[$.ip] && DDOS[$.ip] > 5) {
			$.invalid();
			return;
		}

		var token = $.headers['x-token'] || $.query.token || '0';

		if (!PREF.disconnected && ((!PREF.token && $.path[0] !== '/') || PREF.token === token)) {
			$.success({ token: PREF.token, sa: true });
			return;
		} else {
			var session = MAIN.tokens[token];
			if (session) {
				$.success(session);
				return;
			} else if (!PREF.disconnected && PREF.token === token) {
				$.success({ token: PREF.token, sa: true });
				return;
			}
		}

		if (DDOS[$.ip])
			DDOS[$.ip]++;
		else
			DDOS[$.ip] = 1;

	}

	$.invalid();

});


ON('service', function(counter) {
	if (counter % 15 === 0)
		DDOS = {};
});