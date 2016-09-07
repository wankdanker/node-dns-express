var Usey = require('usey')
	, dns = require('native-dns')
	, dnsTypes = ['A','AAAA', 'ANY', 'NS', 'CNAME', 'PTR', 'NAPTR', 'TXT', 'MX', 'SRV', 'SOA', 'TLSA']
	;

module.exports = ExpressDNS;

function ExpressDNS (options) {
	var DNS = Usey();

	// replace the EventEmitter on the UseyInstance object with the native-dns server
	DNS.events = dns.createServer(options);

	DNS.use(function (req, res, next) {
		req.questions.forEach(function (question) {
			question.header = req.header;
			question.remote = req.remote;
			question.typeName = (dns.consts.qtypeToName(question.type) || "").toLowerCase();
		});

		return next();
	});

	dnsTypes.concat("ALL").forEach(function (type) {
		var ltype = type.toLowerCase();

		// add the ltype methods to the native-dns server
		DNS.events[ltype] = function (route, fn) {
			if (arguments.length === 1) {
				fn = route;
				route = undefined;
			}
			route = RegExp(route);

			DNS.use(function (req, res, next) {
				var questions = req.questions;
				var match = false;
				var question;

				for (var x = 0; x < questions.length; x++) {
					question = questions[x];

					//this is where the matching happens.
					//TODO: expand this to handle matching in ways other than regex
					if ((question.typeName === ltype || ltype === 'all' || question.typeName === 'any') && (question.match = route.exec(question.name))) {
						match = true;
						res.begins += 1;

						fn(question, res, next);
					}
				}

				if (match) {
					return
				}

				return next();
			});
		};
	});

	// copy these Usey methods to the native-dns server
	DNS.events.use = DNS.use.bind(DNS);
	DNS.events.unuse = DNS.unuse.bind(DNS);

	// duplicate the native-dns serve method as listen
	DNS.events.listen = DNS.events.serve;

	// optionally monkey-patch the native-dns close method to hook-in any required 'before-close' logic
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply#Using_apply_in_monkey-patching
	//var close = DNS.events.close.bind(DNS.events);
	//DNS.events.close = function () {
	//	return DNS.events.close.apply(DNS.events, arguments);
	//};

	// receive requests from the native-dns server
	DNS.events.on('request', function (req, res) {
		var request = new DNSRequest(req, res);
		var response = new DNSResponse(req, res);

		DNS(request, response);
	});

	// return the native-dns server
	return DNS.events;
}

function DNSRequest (req, res) {
	var self = this;

	self.questions = req.question;
	self.remote = req.address;
	self.header = req.header;
}

function DNSResponse (req, res) {
	var self = this;
	self.begins = 0;
	self.ends = 0;
	self.header = res.header;

	dnsTypes.forEach(function (type) {
		var ltype = type.toLowerCase();

		self[ltype] = function (rr) {
			if (~['authority', 'additional', 'edns_options'].indexOf(rr && rr.type))
				res[rr.type].push(dns[type].apply(dns, arguments));
			else
				res.answer.push(dns[type].apply(dns, arguments));
			return this;
		}
	});

	self.end = function () {
		self.ends += 1;

		//only send the response if once we have called 'end'
		//for each of the questions.
		if (self.ends >= self.begins) {
			res.send();
		}
	};
}
