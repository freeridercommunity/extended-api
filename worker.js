function _glob(path) {
	if (path.includes('?')) path = path.replace(/\?$/g, '.');
	if (path.includes('*')) {
		path = path.replace(/(?<!\*)(\*)(?!\*)/g, '[^/]$1');
		if (path.includes('**')) path = path.replace(/(\*){2}/g, '.$1');
	}
	if (path.includes('[!')) path = path.replace(/(?<=\[)(\!)(?=.+\])/g, '^');
	// match :id wildcard options
	if (path.includes('/:')) path = path.replace(/:[^\/]+/g, '[^/]+');
	return path
}

const Worker = {
	_routes: {},

	async fetch(req, env, ctx) {
		const corsHeaders = {
			// "Access-Control-Allow-Origin": "*"
			"Access-Control-Allow-Origin": req.headers.get("Origin") || "*",
			// 'Access-Control-Allow-Credentials': 'true',
		};

		if (req.method === "OPTIONS") {
			return new Response(null, {
				headers: {
					...corsHeaders,
					"Access-Control-Allow-Methods": "DELETE, GET, HEAD, PATCH, POST, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type, Authorization"
				}
			});
		}

		const url = new URL(req.url);
		const path = url.pathname.slice(Number(url.pathname.startsWith('/')), url.pathname.endsWith('/') ? -1 : url.pathname.length);

		// const saveData = 'on' === req.headers.get('Save-Data');
		const route = this._route(req.method, path);
		if (typeof route == 'function') {
			if (route.params) {
				Object.defineProperty(req, 'params', { value: {}, writable: false });
				const [_, ...params] = route.regex.exec(path);
				if (params) for (const p in params) req.params[route.params[p]] = params[p];
			}

			try {
				let result = route(req, env, ctx);
				if (result instanceof Promise) result = await result;
				if (!result) return new Response(null, { status: 204 });
				if (result instanceof Response) {
					for (const key in corsHeaders) {
						if (result.headers.has(key)) continue;
						result.headers.set(key, corsHeaders[key]);
					}

					return result;
				}

				if (!(result instanceof Object)) {
					throw new SyntaxError("result must be of type: json");
				}

				if (!result.status) result.status = 200;
				return new Response(JSON.stringify(result), {
					headers: {
						...corsHeaders,
						'Content-Type': 'application/json'
					},
					status: 200
				});
			} catch (err) {
				console.error(err);
				return new Response(JSON.stringify({
					error: {
						code: "Internal Server Error",
						message: err.message || "Unspecified error"
					},
					status: 500
				}), {
					headers: {
						...corsHeaders,
						'Content-Type': 'application/json'
					},
					status: 500
				});
			}
		}

		return new Response(JSON.stringify({
			error: {
				code: "Not Found",
				message: `Endpoint does not exist: ${path}`
			},
			status: 404
		}), {
			headers: {
				...corsHeaders,
				'Content-Type': 'application/json'
			},
			status: 404
		})
	},

	_route(method = 'GET', path) {
		const route = this._routes[method];
		if (!route) return null;
		if (!path) return route;
		let match = route.get(path);
		if (!match) {
			const globs = Array.from(route.keys()).filter(r => r instanceof RegExp).sort((a, b) => b.source.length - a.source.length)
				, glob = globs.find(glob => glob.test(path) /* Match everything, and I mean everything */ /* matchesGlob(path, rout) */);
			if (glob) {
				const globMatch = route.get(glob)
					, matchesException = globMatch.exceptions?.find(glob => typeof glob == 'string' ? glob === path : glob.test(path));
				if (!matchesException) match = route.get(glob);
			}
		}

		return match || route.get('*')
	},

	_saveRoute(method, path, callback, exceptions) {
		if (typeof path != 'string' && !(path instanceof RegExp)) {
			if (!Array.isArray(path)) throw new TypeError("Path must be of type: string");
			for (const p of path) this._saveRoute(method, p, callback, exceptions);
			return;
		}
		if (typeof callback != 'function') throw new TypeError("Callback must be of type: function");
		if (!Object.hasOwn(this._routes, method)) this._routes[method] = new Map();
		if (typeof exceptions == 'object' && exceptions !== null) {
			Object.defineProperty(callback, 'exceptions', {
				value: Object.values(exceptions).map(path => {
					const glob = _glob(path);
					return glob !== path ? new RegExp(`^${glob}$`) : path
				}),
				writable: true
			});
		}

		if (typeof path == 'string') {
			if (path.includes('/:')) {
				const params = [];
				let glob = path;
				if (glob.includes('.')) glob = glob.replace('.', '\\.');
				const partial = glob.replace(/:([^\/]+)/g, (_, param) => {
					params.push(param);
					return '([^/]+)'
				});
				const regex = new RegExp(`^${partial}$`);
				Object.defineProperties(callback, {
					params: { value: Object.freeze(params) },
					regex: { value: regex }
				});
				path = regex;
			} else {
				const glob = _glob(path);
				if (glob !== path) path = new RegExp(`^${glob}$`);
			}
		}

		this._routes[method].set(path, callback)
	}
};

function lazyRoute(method, path, modulePath, handlerName = 'default') {
	let modPromise;
	Worker._saveRoute(method, path, async (req, env, ctx) => {
		modPromise ??= import(modulePath.replace(/(?:\.js)?$/, '.js'));
		const mod = await modPromise;
		return mod[handlerName](req, env)
	})
}

// Create bulk request options due to Cloudflare request limit

// Track routes
lazyRoute('DELETE', 'api/tracks/:id', 'endpoints/tracks/hide');
// Maybe add featuring later -- long term: allow creating feature mods and allowing them to use this endpoint
// lazyRoute('POST', 'api/tracks/:id/totd', 'endpoints/tracks/totd');
// lazyRoute('POST', 'api/tracks/:id/feature', 'endpoints/tracks/feature', 'feature');
// lazyRoute('DELETE', 'api/tracks/:id/feature', 'endpoints/tracks/feature', 'unfeature');
lazyRoute('DELETE', 'api/tracks/:id/races', 'endpoints/tracks/races/remove');

// User routes
lazyRoute('PATCH', 'api/user/email', 'endpoints/user/changeEmail');
// Maybe provide one additional free name change per-user
// Or, charge users coins -- have them authorize this API to pull out coins and send to Calculus
// lazyRoute('PATCH', 'api/user/username', 'endpoints/user/changeUsername');
// Maybe add option to give self OA if user has at least one featured track
// lazyRoute('POST', 'api/user/oa', 'endpoints/user/oa', 'add');
// lazyRoute('DELETE', 'api/user/oa', 'endpoints/user/oa', 'remove');

export default Worker;