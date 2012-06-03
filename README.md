connect-request-timeout
=======================

Request timeout middleware for Express/Connect

An alternative to [connect-timeout](https://github.com/LearnBoost/connect-timeout)

Install
-------

`npm install connect-request-timeout`

Usage
-----

```javascript
var reqTimeout = require('connect-request-timeout');
app.use(reqTimeout() );
```

Documentation
-------------

#### require('connect-request-timeout')(options)

Returns Connect middleware that throws an error after the specified request
timeout elapses.

Default behavior:
- Delay defaults to DEFAULT_TIMEOUT, or DEFAULT_UPLOAD_TIMEOUT if
	Content-Type: multipart/form-data is set
- Once the timer expires, an error is thrown
- If `res.writeHead` or `res.write` are called before the timer expires, then the
	timer is reset. This may continue for a maximum of `maxTimeout` ms.

Options include:

- timeout (defaults to 10 seconds)
- uploadTimeout (defaults to 1 minute)
- maxTimeout - the maximum number of ms to wait for a request even if the
	server is writing data to the ServerResponse Object (defaults to 10 mins.)
- errorPrototype - the type of Error to throw (defaults to `Error`)

Functions added to the request object:

- req.setTimeout([delay, errorProto]) - sets/resets the timeout for this request
- req.clearTimeout() - clears the timeout for this request
- req.getTimeout() - returns the timeout for this request, **not** the number
	of ms remaining.
