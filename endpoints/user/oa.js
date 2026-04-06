import { get, post } from "../../api.js";
import { parseUser, respondWithError } from "../../utils.js";

export async function add(req, env) {
	// Add current user OA if they have at least one featured track
	// Check if they have OA, add if not
	// Or, let them toggle if they have at least one featured track
	const user = await parseUser(req);

	// Check if author is OA first
	// 

	const hasFeatured = await get(`u/${user.username}/created`)
		.then(({ created_tracks: { tracks }}) => {
			if (tracks.length < 1) return false;
			return -1 !== tracks.findIndex(({ featured }) => featured)
		});
	if (!hasFeatured) {
		return respondWithError({
			code: "Forbidden",
			message: "Insufficient notability"
		}, 403);
	}

	// return post(`moderator/toggle_official_author/${user.id}`, null, env.MODERATOR_ASR)
}

export async function remove(req, env) {
	const user = await parseUser(req);

	// Remove current user OA
	// Check if they have OA, remove if so
	// return RequestHandler.get(`moderator/toggle_official_author/${user.id}`, true)
}