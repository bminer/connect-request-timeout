const DEFAULT_TIMEOUT = 10 * 1000; //10 seconds
const DEFAULT_UPLOAD_TIMEOUT = 60 * 1000; //1 minute
const DEFAULT_MAX_TIMEOUT = 10 * 60 * 1000; //10 minutes

/*
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
*/
module.exports = function(options) {
	//Set options
	options = options || {};
	if(options.timeout == null)
		options.timeout = DEFAULT_TIMEOUT;
	if(options.uploadTimeout == null)
		options.uploadTimeout = DEFAULT_UPLOAD_TIMEOUT;
	if(options.maxTimeout == null)
		options.maxTimeout = DEFAULT_MAX_TIMEOUT;
	if(options.errorPrototype == null)
		options.errorPrototype = Error;
	return function(req, res, next) {
		//timeout is the timeout for this request
		var tid,
			timeout = req.is('multipart/form-data') ?
				options.uploadTimeout : options.timeout,
			totalTime = 0,
			activity = false;
		//Add setTimeout and clearTimeout functions
		req.setTimeout = function(newTimeout, errorPrototype) {
			if(newTimeout != null)
				timeout = newTimeout;
			req.clearTimeout();
			tid = setTimeout(function() {
				if(res.finished) return;
				totalTime += timeout;
				var proto = errorPrototype || options.errorPrototype;
				if(totalTime >= options.maxTimeout)
					next(new proto("Timeout " + req.method + " " + req.url) );
				else if(!activity)
					next(new proto("Timeout " + req.method + " " + req.url) );
				else
				{
					activity = false;
					req.setTimeout(timeout, proto);
				}
			}, timeout);
		};
		req.clearTimeout = function() {
			clearTimeout(tid);
		};
		req.getTimeout = function() {
			return timeout;
		};
		//proxy end to clear the timeout
		var oldEnd = res.end;
		res.end = function() {
			req.clearTimeout();
			res.end = oldEnd;
			return res.end.apply(res, arguments);
		};
		//proxy write and writeHead
		var oldWrite = res.write,
		newWrite = res.write = function() {
			activity = true;
			res.write = oldWrite;
			var ret = res.write.apply(res, arguments);
			res.write = newWrite;
			return ret;
		},
		oldWriteHead = res.writeHead,
		newWriteHead = res.writeHead = function() {
			activity = true;
			res.writeHead = oldWriteHead;
			var ret = res.writeHead.apply(res, arguments);
			res.writeHead = newWriteHead;
			return ret;
		};
		//start the timer
		req.setTimeout();
		next();
	};
}