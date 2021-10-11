exports.id = 'slack';
exports.name = 'Slack';
exports.author = 'Peter Sirka';
exports.icon = 'fab fa-slack-hash';
exports.version = '1';
exports.summary = 'Processes Slack messages';
exports.readme = `This extension handles incoming messages from Slack on the \`/sync/slack/\` endpoint.`;

exports.make = function() {

	ROUTE('POST /sync/slack/', function() {
		var self = this;
		if (self.body && self.body.url_verification) {
			self.json(self.body.challenge || '');
		} else {
			FUNC.notify('slack', self);
			self.empty();
		}
	});

};