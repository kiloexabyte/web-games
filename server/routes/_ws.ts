import type { Peer } from "crossws";

interface GameState {
	board: string[];
	currentPlayer: "X" | "O";
	players: Map<string, "X" | "O">;
	winner: string | null;
}

const games = new Map<string, GameState>();
const peerRooms = new Map<string, string>(); // peerId -> roomId

const winningCombos: [number, number, number][] = [
	[0, 1, 2],
	[3, 4, 5],
	[6, 7, 8],
	[0, 3, 6],
	[1, 4, 7],
	[2, 5, 8],
	[0, 4, 8],
	[2, 4, 6],
];

function checkWinner(board: string[]): string | null {
	for (const [a, b, c] of winningCombos) {
		if (board[a] && board[a] === board[b] && board[a] === board[c]) {
			return board[a];
		}
	}
	return null;
}

function createGame(): GameState {
	return {
		board: Array(9).fill(""),
		currentPlayer: "X",
		players: new Map(),
		winner: null,
	};
}

function broadcast(roomId: string, message: object, peers: Map<string, Peer>) {
	const data = JSON.stringify(message);
	for (const [peerId, peer] of peers) {
		if (peerRooms.get(peerId) === roomId) {
			peer.send(data);
		}
	}
}

const connectedPeers = new Map<string, Peer>();

export default defineWebSocketHandler({
	open(peer) {
		console.log("Connected:", peer.id);
		connectedPeers.set(peer.id, peer);
	},

	message(peer, message) {
		const data = JSON.parse(message.text());

		if (data.type === "join-room") {
			const roomId = data.roomId;
			peerRooms.set(peer.id, roomId);

			if (!games.has(roomId)) {
				games.set(roomId, createGame());
			}

			const game = games.get(roomId)!;
			let player: "X" | "O" | null = null;

			if (!Array.from(game.players.values()).includes("X")) {
				player = "X";
			} else if (!Array.from(game.players.values()).includes("O")) {
				player = "O";
			}

			if (player) {
				game.players.set(peer.id, player);
			}

			peer.send(JSON.stringify({ type: "player-assigned", player }));
			broadcast(
				roomId,
				{
					type: "game-state",
					board: game.board,
					currentPlayer: game.currentPlayer,
					winner: game.winner,
					playerCount: game.players.size,
				},
				connectedPeers,
			);
		}

		if (data.type === "make-move") {
			const roomId = peerRooms.get(peer.id);
			if (!roomId) return;

			const game = games.get(roomId);
			if (!game) return;

			const player = game.players.get(peer.id);
			if (!player) return;
			if (player !== game.currentPlayer) return;
			if (game.board[data.index] || game.winner) return;

			game.board[data.index] = player;
			game.winner = checkWinner(game.board);

			if (!game.winner) {
				game.currentPlayer = game.currentPlayer === "X" ? "O" : "X";
			}

			broadcast(
				roomId,
				{
					type: "game-state",
					board: game.board,
					currentPlayer: game.currentPlayer,
					winner: game.winner,
					playerCount: game.players.size,
				},
				connectedPeers,
			);
		}

		if (data.type === "reset-game") {
			const roomId = peerRooms.get(peer.id);
			if (!roomId) return;

			const game = games.get(roomId);
			if (!game) return;

			game.board = Array(9).fill("");
			game.currentPlayer = "X";
			game.winner = null;

			broadcast(
				roomId,
				{
					type: "game-state",
					board: game.board,
					currentPlayer: game.currentPlayer,
					winner: game.winner,
					playerCount: game.players.size,
				},
				connectedPeers,
			);
		}
	},

	close(peer) {
		console.log("Disconnected:", peer.id);
		const roomId = peerRooms.get(peer.id);

		if (roomId) {
			const game = games.get(roomId);
			if (game) {
				game.players.delete(peer.id);
				broadcast(
					roomId,
					{
						type: "game-state",
						board: game.board,
						currentPlayer: game.currentPlayer,
						winner: game.winner,
						playerCount: game.players.size,
					},
					connectedPeers,
				);
			}
			peerRooms.delete(peer.id);
		}

		connectedPeers.delete(peer.id);
	},
});
