import { assertToken, get, post } from "../../api.js";

export async function add(req, env) {
	// Add current user OA if they have at least one featured track
	// Check if they have OA, add if not
	// Or, let them toggle if they have at least one featured track
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

	// Check if author is OA first
	// 

	const hasFeatured = await get(`u/${author.username}/created`)
		.then(({ created_tracks: { tracks }}) => {
			if (tracks.length < 1) return false;
			return -1 !== tracks.findIndex(({ featured }) => featured)
		});
	if (!hasFeatured) {
		return new Response(JSON.stringify({
			error: {
				code: "Forbidden",
				message: "Insufficient notability"
			},
			status: 403
		}), {
			headers: { 'Content-Type': 'application/json' },
			status: 403
		});
	}

	// return post(`moderator/toggle_official_author/${author.id}`, null, env.MODERATOR_ASR)
}

export async function remove(req, env) {
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

	// Remove current user OA
	// Check if they have OA, remove if so
	// return RequestHandler.get(`moderator/toggle_official_author/${uid}`, true)
}