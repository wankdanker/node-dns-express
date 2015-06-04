var server = require('./')();

server.a(/[^.]*.domain.com/, function (req, res, next) {
	res.a({
		name : req.name
		, address : '1.2.3.4'
		, ttl : 600
	})

	res.end();
});

server.use(function (req, res) {
	//End the response if no "routes" are matched
	res.end();
});

server.listen(53535)

