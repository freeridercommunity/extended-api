import { assertToken, get, post } from "../../api.js";

export default async function(req, env) {
	if (isNaN(req.params.id)) {
		return new Response(JSON.stringify({
			error: {
				code: "Bad Request",
				message: "Invalid track ID"
			},
			status: 400
		}), {
			headers: { 'Content-Type': 'application/json' },
			status: 400
		});
	}

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

	const track = await get(`track_api/load_track?id=${req.params.id}&fields[]=u_id&fields[]=hide`)
		.catch(err => null);
	if (!track) return new Response("Track Not Found", { status: 404 });
	if (author.id !== track.track.u_id) return new Response("Forbidden", { status: 403 });
	if (track.track.hide === 1) return {
		message: "Track is already hidden",
		status: 200
	};

	return post("moderator/hide_track/" + parseInt(req.params.id), null, env.MODERATOR_ASR)
		.then(r => {
			return {
				message: `Track ${req.params.id} has successfully been hidden`,
				status: 200
			}
		})
}