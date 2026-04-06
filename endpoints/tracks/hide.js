import { get, post } from "../../api.js";
import { parseUser, respondWithError } from "../../utils.js";

export default async function(req, env) {
	if (isNaN(req.params.id)) {
		return respondWithError({
			code: "Bad Request",
			message: "Invalid track ID"
		}, 400);
	}

	const user = await parseUser(req);
	const track = await get(`track_api/load_track?id=${req.params.id}&fields[]=u_id&fields[]=hide`)
		.catch(err => null);
	if (!track) {
		return respondWithError({
			code: "Not Found",
			message: "Track does not exist"
		}, 404);
	}

	if (user.id !== track.track.u_id) {
		return respondWithError({
			code: "Forbidden",
			message: "You may only hide your own tracks"
		}, 403);
	}

	if (track.track.hide === 1) {
		return {
			message: "Track is already hidden",
			status: 200
		};
	}

	return post("moderator/hide_track/" + req.params.id, null, env.MODERATOR_ASR)
		.then(r => {
			return {
				message: `Track ${req.params.id} has successfully been hidden`,
				status: 200
			}
		})
}