import { post } from "../../api.js";
import { parseUser, respondWithError } from "../../utils.js";

export default async function(req, env) {
	const user = await parseUser(req);

	const body = await req.json();
	if (!body.email || !body.email.includes('@')) {
		return respondWithError({
			code: "Bad Request",
			message: "Please provide a valid email",
			fields: { email: 'Invalid or missing email' }
		}, 400);
	} else if (!body.password) {
		return respondWithError({
			code: "Bad Request",
			message: "Please provide a password",
			fields: { password: 'Missing password' }
		}, 400);
	}

	// Assert password
	const isPasswordValid = await post('auth/standard_login', {
		login: user.username,
		password: body.password
	});
	if (!isPasswordValid) {
		return respondWithError({
			code: "Unauthorized",
			message: "Authentication failed",
			fields: { password: 'Invalid password' }
		}, 401);
	}

	return post('moderator/change_email', {
		u_id: user.id,
		email: body.email
	}, env.MODERATOR_ASR).then(r => {
		return {
			message: `Successfully changed user email to ${body.email}`,
			fields: { email: body.email }
		}
	})
}