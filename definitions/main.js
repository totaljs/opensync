MAIN.version = 1;
MAIN.tokens = {};
MAIN.stats = MEMORIZE('stats');
MAIN.files = {};
MAIN.sse = [];

ON('ready', function() {
	PREF.name && LOADCONFIG({ name: PREF.name, allow_tms: PREF.allow_tms, secret_tms: PREF.secret_tms });
	FUNC.preparetokens();
});