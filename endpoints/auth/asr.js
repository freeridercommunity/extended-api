import { post } from "../../api.js";
import { respondWithError } from "../../utils.js";

export default async function(req) {
	// Only allow Free Rider HD Community forums
	// if (req.headers.get("Origin")) {}

	const body = await req.json();
	if (!body.login || body.login.length < 3) {
		return respondWithError({
			code: "Bad Request",
			message: "Please provide a valid username",
			fields: { email: 'Invalid or missing username' }
		}, 400);
	} else if (!body.password) {
		return respondWithError({
			code: "Bad Request",
			message: "Please provide a password",
			fields: { password: 'Missing password' }
		}, 400);
	}

	const { app_signed_request: asr } = await post('auth/standard_login', {
		login: body.login,
		password: body.password,
		verbatim: true
	});
	if (!asr) {
		return respondWithError({
			code: "Unauthorized",
			message: "Authentication failed",
			fields: { password: 'Invalid password' }
		}, 401);
	}

	return {
		token: asr,
		status: 200
	}
}