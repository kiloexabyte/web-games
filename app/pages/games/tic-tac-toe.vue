<template>
	<div
		id="screen"
		class="flex h-dvh w-full flex-col items-center justify-center gap-8 bg-amber-300"
	>
		<h1 class="text-4xl font-bold">Tic Tac Toe</h1>

		<!-- Join Room -->
		<div v-if="!inRoom" class="flex items-center gap-2">
			<input
				v-model="roomId"
				type="text"
				placeholder="Room ID"
				class="rounded border px-3 py-2"
				@keyup.enter="joinRoom"
			/>
			<button
				class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-500"
				@click="joinRoom"
			>
				Join
			</button>
		</div>

		<!-- Game -->
		<template v-else>
			<p class="text-lg">
				Room: {{ roomId }} | You: {{ myPlayer || "spectator" }} | Players:
				{{ playerCount }}/2
			</p>

			<div id="game-board" class="grid grid-cols-3 gap-2">
				<button
					v-for="(cell, index) in board"
					:key="index"
					class="flex h-24 w-24 items-center justify-center bg-white text-4xl font-bold hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
					:disabled="!canMove"
					@click="makeMove(index)"
				>
					{{ cell }}
				</button>
			</div>

			<p class="text-xl font-semibold">{{ status }}</p>
			<div class="flex gap-4">
				<button
					class="rounded bg-gray-800 px-4 py-2 text-white hover:bg-gray-700"
					@click="resetGame"
				>
					Reset
				</button>
				<button
					class="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-500"
					@click="leaveRoom"
				>
					Leave
				</button>
			</div>
		</template>
	</div>
</template>

<script lang="ts" setup>
const socket = ref<WebSocket | null>(null);
const roomId = ref("");
const inRoom = ref(false);
const myPlayer = ref<"X" | "O" | null>(null);
const board = ref<string[]>(Array(9).fill(""));
const currentPlayer = ref<"X" | "O">("X");
const winner = ref<string | null>(null);
const playerCount = ref(0);

const canMove = computed(() => {
	if (winner.value) return false;
	if (playerCount.value < 2) return false;
	return myPlayer.value === currentPlayer.value;
});

const status = computed(() => {
	if (winner.value) return `Winner: ${winner.value}`;
	if (board.value.every((cell) => cell)) return "Draw!";
	if (playerCount.value < 2) return "Waiting for opponent...";
	if (myPlayer.value !== currentPlayer.value) return "Opponent's turn";
	return "Your turn";
});

function joinRoom() {
	if (!roomId.value) return;

	const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
	socket.value = new WebSocket(`${protocol}//${window.location.host}/_ws`);

	socket.value.onopen = () => {
		socket.value?.send(
			JSON.stringify({ type: "join-room", roomId: roomId.value }),
		);
		inRoom.value = true;
	};

	socket.value.onmessage = (event) => {
		const data = JSON.parse(event.data);

		if (data.type === "player-assigned") {
			myPlayer.value = data.player;
		}

		if (data.type === "game-state") {
			board.value = data.board;
			currentPlayer.value = data.currentPlayer;
			winner.value = data.winner;
			playerCount.value = data.playerCount;
		}
	};
}

function makeMove(index: number) {
	socket.value?.send(JSON.stringify({ type: "make-move", index }));
}

function resetGame() {
	socket.value?.send(JSON.stringify({ type: "reset-game" }));
}

function leaveRoom() {
	socket.value?.close();
	socket.value = null;
	inRoom.value = false;
	myPlayer.value = null;
	board.value = Array(9).fill("");
	currentPlayer.value = "X";
	winner.value = null;
	playerCount.value = 0;
}

onUnmounted(() => {
	socket.value?.close();
});
</script>
