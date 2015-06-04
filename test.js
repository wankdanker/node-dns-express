var ExpressDNS = require('./');

var t = ExpressDNS();

t.use(function (req, res, next) {
	console.log('all use');

	res.txt({
		name : 'thing-text'
		, data : [ "farq" ]
		, ttl : 600
	});

	return next();
});

t.all(/.*/, function (req, res, next) {
	console.log(('all'));
	return next();

});

t.a(/.*/, function (req, res, next) {
	console.log('in the route');
	res.a({ name : 'thing', address : '127.0.0.1', ttl : 600 });
	res.end();
});

t.mx(function (req, res, next) {
	console.log('all mx');

	return next();
});

t.use(function (req, res) {
	res.end();
});

t.listen(15343);
