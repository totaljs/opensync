// Meta information
exports.id = 'slack';
exports.name = 'Slack';
exports.author = 'Peter Sirka';
exports.icon = 'fab fa-slack-hash';
exports.version = '1';
exports.summary = 'Processes Slack messages: /sync/slack/';

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