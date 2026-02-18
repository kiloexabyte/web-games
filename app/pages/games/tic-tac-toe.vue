<template>
    <div id="screen" class="flex flex-col items-center justify-center w-full bg-amber-300 h-dvh gap-8">
        <h1 class="text-4xl font-bold">Tic Tac Toe</h1>

        <div id="game-board" class="grid grid-cols-3 gap-2">
            <button
                v-for="(cell, index) in board"
                :key="index"
                class="w-24 h-24 bg-white text-4xl font-bold flex items-center justify-center hover:bg-gray-100"
                @click="makeMove(index)"
            >
                {{ cell }}
            </button>
        </div>

        <p class="text-xl font-semibold">{{ status }}</p>
        <button
            class="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
            @click="resetGame"
        >
            Reset
        </button>
    </div>
</template>

<script lang="ts" setup>
const board = ref<string[]>(Array(9).fill(''))
const currentPlayer = ref<'X' | 'O'>('X')
const winner = ref<string | null>(null)

const status = computed(() => {
    if (winner.value) return `Winner: ${winner.value}`
    if (board.value.every(cell => cell)) return "It's a draw!"
    return `Current player: ${currentPlayer.value}`
})

const winningCombos: [number, number, number][] = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6] // diagonals
]

function checkWinner(): string | null {
    for (const combo of winningCombos) {
        const [a, b, c] = combo
        if (board.value[a] && board.value[a] === board.value[b] && board.value[a] === board.value[c]) {
            return board.value[a]
        }
    }
    return null
}

function makeMove(index: number) {
    if (board.value[index] || winner.value) return
    board.value[index] = currentPlayer.value
    winner.value = checkWinner()
    if (!winner.value) {
        currentPlayer.value = currentPlayer.value === 'X' ? 'O' : 'X'
    }
}

function resetGame() {
    board.value = Array(9).fill('')
    currentPlayer.value = 'X'
    winner.value = null
}
</script>