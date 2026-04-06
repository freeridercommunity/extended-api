import { get, post } from "../../../api.js";
import { parseUser, respondWithError } from "../../../utils.js";

export default async function(req, env) {
	if (isNaN(req.params.id)) {
		return respondWithError({
			code: "Bad Request",
			message: "Invalid track ID"
		}, 400);
	}

	const user = await parseUser(req);
	const races = await get(`track_api/load_races?t_id=${req.params.id}&u_ids=${user.id}`);

	const race = races[0];
	if (!race) {
		return respondWithError({
			code: "Not Found",
			message: "Race does not exist"
		}, 404);
	}

	const raceUid = user.id; // race.user.u_id;
	return post("moderator/remove_race", {
		t_id: req.params.id,
		u_id: raceUid
	}, env.MODERATOR_ASR).then(r => {
		return { message: r.message || `Race removed from track ${req.params.id}` }
	})
}