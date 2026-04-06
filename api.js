const BASE_URL = 'https://www.freeriderhd.com/';

export default function api(endpoint = '', opts = null, asr) {
	const searchParams = new URLSearchParams({
		ajax: '',
		t_1: 'ref',
		t_2: 'cf'
	});

	if (endpoint.includes('?')) {
		const parts = endpoint.split('?');
		endpoint = parts.shift();
		const existingParams = new URLSearchParams(parts.pop());
		for (const [key, value] of existingParams) {
			searchParams.append(key, value);
		}
	}

	if (typeof asr == 'string') {
		searchParams.set('app_signed_request', asr);
	}

	let verbatim = false;

	const options = {
		headers: { 'User-Agent': "Mozilla/5.0 (Windows NT 10.0) Chrome/120 Cloudflare Worker" }
	};

	const method = opts?.method.toUpperCase() || 'GET';
	if (method != 'GET') {
		options.method = method;
	} else if (opts?.body instanceof Object) {
		if (opts.body.verbatim) {
			verbatim = true;
			delete opts.body.verbatim;
		}

		for (const [key, value] of Object.entries(opts.body)) {
			searchParams.set(key, value);
		}

		delete opts.body;

		if (Object.keys(opts).length < 1) opts = null;
	}

	const args = [BASE_URL + endpoint + '?' + searchParams.toString(), options];

	if (opts instanceof Object && opts.body instanceof Object) {
		if (opts.body.verbatim) {
			verbatim = true;
			delete opts.body.verbatim;
		}

		options.headers['Content-Type'] = "application/x-www-form-urlencoded";
		options.body = new URLSearchParams(opts.body);
	}

	// console.debug(...args);

	return fetch(...args)
		.then(r => {
			if (r.status >= 400) {
				throw new Error(r.statusText || "Failed to fetch");
			}

			return r.json()
		})
		.then(r => {
			if ((r.code >= 400 || r.result === false) && !Array.isArray(r.data)) {
				throw new Error(r.msg || "Request was unsuccessful");
			}

			if (verbatim) return r;
			return r.data ?? r
		})
}

export async function assertToken(token) {
	return api('account/settings', null, token)
		.then(r => ({
			admin: r.user.admin,
			id: r.user.u_id,
			moderator: r.user.moderator,
			plus: r.user.plus,
			username: r.user.u_name
		}))
		.catch(err => null)
}

export function get(endpoint, ...args) {
	return api(endpoint, ...args)
}

export function post(endpoint, payload, ...args) {
	return api(endpoint, {
		body: payload,
		method: 'POST'
	}, ...args)
}

// export function delete(endpoint, payload) {
// 	return api(endpoint, {
// 		body: payload,
// 		method: 'DELETE'
// 	})
// }