import { assertToken, post } from "../../api.js";

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
	if (!body.email || !body.email.includes('@')) {
		return new Response(JSON.stringify({
			error: {
				code: "Bad Request",
				message: "Please provide a valid email",
				fields: { email: 'Invalid or missing email' }
			},
			status: 400
		}), {
			headers: { 'Content-Type': 'application/json' },
			status: 400
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
	});
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

	return post('moderator/change_email', {
		u_id: author.id,
		email: body.email
	}, env.MODERATOR_ASR).then(r => {
		console.debug('Change email response:', r);
		return { message: `Successfully changed user email to ${body.email}` }
	})
}