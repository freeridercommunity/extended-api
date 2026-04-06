import { get, post } from "../../api.js";
import { parseUser, respondWithError } from "../../utils.js";

export default async function(req, env) {
	const user = await parseUser(req);

	const body = await req.json();
	if (!body.username) {
		return respondWithError({
			code: "Bad Request",
			message: "Please provide a valid username",
			fields: { username: 'Invalid or missing username' }
		}, 400);
	}

	const usernameExists = await get(`u/${body.username}`)
		.catch(err => null);
	if (usernameExists) {
		return respondWithError({
			code: "Conflict",
			message: "A user with that username already exists",
			fields: { username: 'Existing username' }
		}, 409);
	}

	if (!body.password) {
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
	}, env.MODERATOR_ASR);
	if (!isPasswordValid) {
		return respondWithError({
			code: "Unauthorized",
			message: "Authentication failed",
			fields: { password: 'Invalid password' }
		}, 401);
	}


	return respondWithError({
		code: "Not Implemented",
		message: "Not implemented: contact a moderator to change your username"
	}, 501)

	// return post('moderator/change_username', {
	// 	u_id: user.id,
	// 	username: body.username
	// }).then(r => {
	// 	console.debug('Change username response:', r);
	// 	return { message: `Successfully changed username to ${body.username}` }
	// })
}