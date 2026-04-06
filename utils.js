import { assertToken } from "./api.js";

export async function parseUser({ headers }) {
	const asr = headers.get('Authorization')?.split(/\s+/g).pop();
	if (!asr) {
		throw respondWithError({
			code: "Bad Request",
			message: "Missing headers: Authorization"
		}, 400);
	}

	const user = await assertToken(asr);
	if (!user) {
		throw respondWithError({
			code: "Unauthorized",
			message: "Authentication failed: invalid token"
		}, 401);
	}

	return user
}

export function respondWithError(data, status = 400) {
	return json({ error: data }, status)
}

export function json(data, status = 200) {
	return new Response(JSON.stringify(Object.assign({ status }, data)), {
		headers: { 'Content-Type': "application/json" },
		status
	})
}