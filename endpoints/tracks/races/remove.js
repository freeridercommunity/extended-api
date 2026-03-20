import { assertToken, get, post } from "../../../api.js";

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

	const races = await get(`track_api/load_races?t_id=${req.params.id}&u_ids=${author.id}`);
	const race = races[0];

	if (!race) return new Response("Race Not Found", { status: 404 });

	const raceUid = author.id; // race.user.u_id;
	return post("moderator/remove_race", {
		t_id: req.params.id,
		u_id: raceUid
	}, env.MODERATOR_ASR).then(r => {
		console.debug('Race remove response:', r);
		return { message: r.message || `Race removed from track ${req.params.id}` }
	})
}