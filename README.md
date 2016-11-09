dns-express
-----------

An attempt at an Express style DNS server

install
-------

```bash
npm install dns-express
```

example
-------

```js
var server = require('dns-express')();

server.a(/^(?:[^.]+\.)*domain\.com$/i, function (req, res, next) {
	//Add an A record to the response's answer.
	res.a({
		name : req.name
		, address : '1.2.3.4'
		, ttl : 600
	})

	return res.end();
});

server.use(function (req, res) {
	//End the response if no "routes" are matched
	res.end();
});

server.listen(53535)
```

```bash
dig something.domain.com @127.0.0.1 -p 53535
```

todo
----

* Expand documentation
* Tests

license
-------

MIT
