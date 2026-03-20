import { assertToken, get, post } from "../../api.js";

export default async function(req, env) {
	const asr = req.headers.get('Authorization')?.split(/\s+/g).pop();
	const author = await assertToken(asr);
	if (!author) {
		return new Response(JSON.stringify({
			error: {
				code: "Unauthorized",
				message: "Authentication failed"
			},
			status: 401
		}), {
			headers: { 'Content-Type': 'application/json' },
			status: 401
		});
	}

	const body = await req.json();
	if (!body.username) {
		return new Response(JSON.stringify({
			error: {
				code: "Bad Request",
				message: "Please provide a valid username",
				fields: { username: 'Invalid or missing username' }
			},
			status: 400
		}), {
			headers: { 'Content-Type': 'application/json' },
			status: 400
		});
	}

	const usernameExists = await get(`u/${body.username}`)
		.catch(err => null);
	if (usernameExists) {
		return new Response(JSON.stringify({
			error: {
				code: "Conflict",
				message: "A user with that username already exists",
				fields: { username: 'Existing username' }
			},
			status: 409
		}), {
			headers: { 'Content-Type': 'application/json' },
			status: 409
		});
	}

	if (!body.password) {
		return new Response(JSON.stringify({
			error: {
				code: "Bad Request",
				message: "Please provide a password",
				fields: { password: 'Missing password' }
			},
			status: 400
		}), {
			headers: { 'Content-Type': 'application/json' },
			status: 400
		});
	}

	// Assert password
	const isPasswordValid = await post('auth/standard_login', {
		login: author.username,
		password: body.password
	}, env.MODERATOR_ASR);
	if (!isPasswordValid) {
		return new Response(JSON.stringify({
			error: {
				code: "Unauthorized",
				message: "Authentication failed",
				fields: { password: 'Invalid password' }
			},
			status: 401
		}), {
			headers: { 'Content-Type': 'application/json' },
			status: 401
		});
	}

	return post('moderator/change_username', {
		u_id: author.id,
		username: body.username
	}).then(r => {
		console.debug('Change username response:', r);
		return { message: `Successfully changed username to ${body.username}` }
	})
}