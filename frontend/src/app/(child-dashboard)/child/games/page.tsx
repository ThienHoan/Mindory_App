'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { api } from '@/lib/api-client'

type GameId = 'number' | 'memory' | 'music' | 'maze' | 'color'

interface AudioControls {
    musicOn: boolean
    toggleMusic: () => void
    playTone: (freq: number, duration?: number, type?: OscillatorType, gain?: number) => void
    playSuccess: () => void
    playError: () => void
}

interface PlayReportPayload {
    gameId: GameId
    score: number
    accuracy: number
    durationSeconds: number
    starsEarned: number
}

const STAR_KEY = 'mindory:mini-game:stars'

function shuffleArray<T>(items: T[]) {
    const copied = [...items]
    for (let i = copied.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[copied[i], copied[j]] = [copied[j], copied[i]]
    }
    return copied
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function useAudioControls(): AudioControls {
    const audioContextRef = useRef<AudioContext | null>(null)
    const musicTimerRef = useRef<number | null>(null)
    const [musicOn, setMusicOn] = useState(false)

    const initContext = useCallback(async () => {
        if (typeof window === 'undefined') return null
        if (!audioContextRef.current) {
            audioContextRef.current = new window.AudioContext()
        }
        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume()
        }
        return audioContextRef.current
    }, [])

    const playTone = useCallback(
        async (freq: number, duration = 0.2, type: OscillatorType = 'sine', gainValue = 0.08) => {
            const ctx = await initContext()
            if (!ctx) return

            const oscillator = ctx.createOscillator()
            const gain = ctx.createGain()
            oscillator.type = type
            oscillator.frequency.value = freq
            gain.gain.setValueAtTime(gainValue, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
            oscillator.connect(gain)
            gain.connect(ctx.destination)
            oscillator.start()
            oscillator.stop(ctx.currentTime + duration)
        },
        [initContext]
    )

    const playSuccess = useCallback(() => {
        void playTone(523.25, 0.12, 'triangle', 0.09)
        setTimeout(() => void playTone(659.25, 0.12, 'triangle', 0.09), 120)
        setTimeout(() => void playTone(783.99, 0.18, 'triangle', 0.09), 240)
    }, [playTone])

    const playError = useCallback(() => {
        void playTone(220, 0.12, 'sawtooth', 0.07)
        setTimeout(() => void playTone(196, 0.18, 'sawtooth', 0.07), 100)
    }, [playTone])

    const stopMusic = useCallback(() => {
        if (musicTimerRef.current !== null) {
            window.clearInterval(musicTimerRef.current)
            musicTimerRef.current = null
        }
    }, [])

    const startMusic = useCallback(() => {
        const melody = [392, 440, 523.25, 659.25, 523.25, 440]
        let noteIndex = 0
        stopMusic()
        musicTimerRef.current = window.setInterval(() => {
            void playTone(melody[noteIndex % melody.length], 0.16, 'triangle', 0.03)
            noteIndex += 1
        }, 520)
    }, [playTone, stopMusic])

    const toggleMusic = useCallback(() => {
        setMusicOn((prev) => {
            const next = !prev
            if (next) startMusic()
            else stopMusic()
            return next
        })
    }, [startMusic, stopMusic])

    useEffect(() => {
        return () => {
            stopMusic()
            if (audioContextRef.current) {
                void audioContextRef.current.close()
            }
        }
    }, [stopMusic])

    return { musicOn, toggleMusic, playTone, playSuccess, playError }
}

function NumberChaseGame({ onReportPlay, audio }: { onReportPlay: (payload: PlayReportPayload) => void; audio: AudioControls }) {
    const [sequence, setSequence] = useState<number[]>(() => Array.from({ length: 9 }, (_, i) => i + 1))
    const [nextNumber, setNextNumber] = useState(1)
    const [message, setMessage] = useState('Chạm đúng theo thứ tự 1 → 9 nhé!')
    const [wrongPicks, setWrongPicks] = useState(0)
    const roundStartRef = useRef(Date.now())

    useEffect(() => {
        setSequence(shuffleArray(Array.from({ length: 9 }, (_, i) => i + 1)))
    }, [])

    const resetRound = useCallback(() => {
        setSequence(shuffleArray(Array.from({ length: 9 }, (_, i) => i + 1)))
        setNextNumber(1)
        setWrongPicks(0)
        roundStartRef.current = Date.now()
    }, [])

    const handlePick = (value: number) => {
        if (value !== nextNumber) {
            audio.playError()
            setWrongPicks((prev) => prev + 1)
            setMessage(`Thử lại nhé! Bé cần chọn số ${nextNumber}.`)
            return
        }

        void audio.playTone(360 + value * 35, 0.1, 'square', 0.08)
        if (value === 9) {
            audio.playSuccess()
            const duration = Math.max(5, Math.round((Date.now() - roundStartRef.current) / 1000))
            const accuracy = Math.round((9 / (9 + wrongPicks)) * 100)
            onReportPlay({
                gameId: 'number',
                score: Math.max(10, 100 - wrongPicks * 8),
                accuracy,
                durationSeconds: duration,
                starsEarned: 8,
            })
            setMessage('Giỏi quá! Bé vừa hoàn thành màn bắt số.')
            setTimeout(() => {
                resetRound()
                setMessage('Màn mới bắt đầu!')
            }, 900)
            return
        }

        setNextNumber((prev) => prev + 1)
        setMessage(`Tuyệt vời! Tiếp theo chọn số ${value + 1}.`)
    }

    return (
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-xl font-black text-slate-800">Bắt Số Nhanh</h3>
                <button
                    type="button"
                    onClick={resetRound}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"
                >
                    Chơi lại
                </button>
            </div>
            <p className="mb-4 rounded-2xl bg-sky-50 px-4 py-3 text-sm font-bold text-sky-700">{message}</p>
            <div className="grid grid-cols-3 gap-3">
                {sequence.map((num) => {
                    const passed = num < nextNumber
                    return (
                        <button
                            key={num}
                            type="button"
                            disabled={passed}
                            onClick={() => handlePick(num)}
                            className={cn(
                                'h-20 rounded-2xl text-2xl font-black transition-all',
                                passed
                                    ? 'cursor-default bg-emerald-100 text-emerald-500'
                                    : 'bg-indigo-500 text-white shadow-md hover:-translate-y-0.5 hover:bg-indigo-600'
                            )}
                        >
                            {num}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

interface MemoryCard {
    id: string
    emoji: string
    matched: boolean
}

interface MemoryLevelConfig {
    pairs: number
    cheer: string
}

const MEMORY_LEVELS: MemoryLevelConfig[] = [
    { pairs: 6, cheer: 'Bắt đầu nhẹ nhàng nhé con!' },
    { pairs: 8, cheer: 'Tốt lắm, thêm vài thẻ nữa nào!' },
    { pairs: 10, cheer: 'Con ghi nhớ rất nhanh, cố lên!' },
    { pairs: 12, cheer: 'Màn này khó hơn một chút, bình tĩnh nhé!' },
    { pairs: 14, cheer: 'Siêu trí nhớ của con đang tỏa sáng!' },
]

const MEMORY_EMOJI_POOL = ['🐼', '🦊', '🐳', '🦁', '🐧', '🐸', '🐯', '🐻', '🐰', '🐨', '🦉', '🦄', '🐙', '🦋', '🐢', '🦖', '🐬', '🦜', '🐘', '🐵']

function createMemoryCards(pairCount: number) {
    const emojis = shuffleArray(MEMORY_EMOJI_POOL).slice(0, pairCount)
    return emojis.flatMap((emoji, idx) => [
        { id: `${emoji}-${idx}-a`, emoji, matched: false },
        { id: `${emoji}-${idx}-b`, emoji, matched: false },
    ])
}

function createShuffledMemoryCards(pairCount: number) {
    return shuffleArray(createMemoryCards(pairCount))
}

function MemoryFlipGame({ onReportPlay, audio }: { onReportPlay: (payload: PlayReportPayload) => void; audio: AudioControls }) {
    const [levelIndex, setLevelIndex] = useState(0)
    const [bestLevel, setBestLevel] = useState(0)
    const [speechOn, setSpeechOn] = useState(true)
    const [cards, setCards] = useState<MemoryCard[]>(() => createMemoryCards(MEMORY_LEVELS[0].pairs))
    const [openIndexes, setOpenIndexes] = useState<number[]>([])
    const [moves, setMoves] = useState(0)
    const [locked, setLocked] = useState(false)
    const [completedRound, setCompletedRound] = useState(false)
    const roundStartRef = useRef(Date.now())
    const voiceListRef = useRef<SpeechSynthesisVoice[]>([])
    const mismatchTimerRef = useRef<number | null>(null)
    const level = MEMORY_LEVELS[levelIndex]

    const matchedCount = cards.filter((card) => card.matched).length

    const speakEncourage = useCallback((text: string) => {
        if (!speechOn || typeof window === 'undefined' || !('speechSynthesis' in window)) return
        const synth = window.speechSynthesis
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'vi-VN'
        utterance.rate = 0.98
        utterance.pitch = 1.08
        const voices = voiceListRef.current.length > 0 ? voiceListRef.current : synth.getVoices()
        const preferred =
            voices.find((v) => /google/i.test(v.name) && /vi/i.test(v.lang)) ??
            voices.find((v) => /vi/i.test(v.lang)) ??
            voices.find((v) => /google/i.test(v.name))
        if (preferred) utterance.voice = preferred
        synth.cancel()
        synth.speak(utterance)
    }, [speechOn])

    useEffect(() => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
        const synth = window.speechSynthesis
        const assignVoices = () => {
            voiceListRef.current = synth.getVoices()
        }
        assignVoices()
        synth.addEventListener('voiceschanged', assignVoices)
        return () => synth.removeEventListener('voiceschanged', assignVoices)
    }, [])

    const resetRound = useCallback(() => {
        if (mismatchTimerRef.current !== null) {
            window.clearTimeout(mismatchTimerRef.current)
            mismatchTimerRef.current = null
        }
        setCards(createShuffledMemoryCards(level.pairs))
        setOpenIndexes([])
        setMoves(0)
        setLocked(false)
        setCompletedRound(false)
        roundStartRef.current = Date.now()
    }, [level.pairs])

    useEffect(() => {
        resetRound()
        speakEncourage(`Màn ${levelIndex + 1}. ${level.cheer}`)
    }, [level.cheer, levelIndex, resetRound, speakEncourage])

    useEffect(() => {
        return () => {
            if (mismatchTimerRef.current !== null) {
                window.clearTimeout(mismatchTimerRef.current)
            }
        }
    }, [])

    const handleFlip = (index: number) => {
        if (locked || openIndexes.includes(index) || cards[index]?.matched) return

        const nextOpen = [...openIndexes, index]
        setOpenIndexes(nextOpen)
        void audio.playTone(480, 0.08, 'triangle', 0.05)

        if (nextOpen.length < 2) return

        const [first, second] = nextOpen
        setMoves((prev) => prev + 1)

        if (cards[first].emoji === cards[second].emoji) {
            setCards((prev) =>
                prev.map((card, i) => (i === first || i === second ? { ...card, matched: true } : card))
            )
            setOpenIndexes([])
            audio.playSuccess()
            return
        }

        setLocked(true)
        audio.playError()
        mismatchTimerRef.current = window.setTimeout(() => {
            setOpenIndexes([])
            setLocked(false)
            mismatchTimerRef.current = null
        }, 700)
    }

    useEffect(() => {
        if (matchedCount !== cards.length || completedRound) return
        setCompletedRound(true)
        setBestLevel((prev) => Math.max(prev, levelIndex + 1))
        if (levelIndex >= MEMORY_LEVELS.length - 1) {
            speakEncourage('Con đã hoàn thành toàn bộ màn lật thẻ. Quá xuất sắc!')
        } else {
            speakEncourage(`Con qua màn ${levelIndex + 1} rồi. Giỏi lắm!`)
        }
        const duration = Math.max(8, Math.round((Date.now() - roundStartRef.current) / 1000))
        const optimalMoves = cards.length / 2
        const accuracy = Math.max(40, Math.round((optimalMoves / Math.max(moves, optimalMoves)) * 100))
        onReportPlay({
            gameId: 'memory',
            score: Math.max(20, 130 + levelIndex * 18 - moves * 5),
            accuracy,
            durationSeconds: duration,
            starsEarned: Math.min(22, 9 + levelIndex * 2),
        })
    }, [cards.length, completedRound, levelIndex, matchedCount, moves, onReportPlay, speakEncourage])

    const nextLevel = useCallback(() => {
        if (levelIndex >= MEMORY_LEVELS.length - 1) {
            setLevelIndex(0)
            setBestLevel(0)
            return
        }
        setLevelIndex((prev) => prev + 1)
    }, [levelIndex])

    const gridColsClass = useMemo(() => {
        const totalCards = level.pairs * 2
        if (totalCards <= 16) return 'grid-cols-4'
        if (totalCards <= 20) return 'grid-cols-5'
        return 'grid-cols-6'
    }, [level.pairs])

    return (
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-xl font-black text-slate-800">Lật Thẻ Ghi Nhớ</h3>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setSpeechOn((prev) => !prev)}
                        className={cn(
                            'rounded-xl border px-3 py-2 text-xs font-black',
                            speechOn ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600'
                        )}
                    >
                        {speechOn ? '🔊 Giọng nói bật' : '🔈 Giọng nói tắt'}
                    </button>
                    <button
                        type="button"
                        onClick={resetRound}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"
                    >
                        Chơi lại màn
                    </button>
                </div>
            </div>
            <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                Màn {levelIndex + 1}/{MEMORY_LEVELS.length} • Ghép đủ {level.pairs} cặp để qua màn nhé!
            </div>
            <div className={cn('grid gap-3', gridColsClass)}>
                {cards.map((card, index) => {
                    const isOpen = openIndexes.includes(index) || card.matched
                    return (
                        <button
                            key={card.id}
                            type="button"
                            onClick={() => handleFlip(index)}
                            className={cn(
                                'h-16 rounded-2xl text-2xl font-black transition-all',
                                isOpen ? 'bg-white ring-2 ring-emerald-300 ctm-pop' : 'bg-emerald-500 text-emerald-500 hover:bg-emerald-600'
                            )}
                        >
                            {isOpen ? card.emoji : '❔'}
                        </button>
                    )
                })}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs font-black text-slate-500">Lượt: {moves} • Đã ghép: {matchedCount / 2}/{level.pairs} • Màn cao nhất: {bestLevel}/{MEMORY_LEVELS.length}</p>
                {completedRound ? (
                    <button
                        type="button"
                        onClick={nextLevel}
                        className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-700"
                    >
                        {levelIndex >= MEMORY_LEVELS.length - 1 ? 'Chơi lại từ màn 1' : 'Qua màn tiếp theo'}
                    </button>
                ) : null}
            </div>
        </div>
    )
}

const MUSIC_PADS = [
    { color: 'bg-rose-500 hover:bg-rose-600', active: 'ring-4 ring-rose-200', freq: 261.63, label: 'Đô' },
    { color: 'bg-amber-500 hover:bg-amber-600', active: 'ring-4 ring-amber-200', freq: 329.63, label: 'Mi' },
    { color: 'bg-sky-500 hover:bg-sky-600', active: 'ring-4 ring-sky-200', freq: 392, label: 'Sol' },
    { color: 'bg-violet-500 hover:bg-violet-600', active: 'ring-4 ring-violet-200', freq: 523.25, label: 'Đố' },
]

function MusicPatternGame({ onReportPlay, audio }: { onReportPlay: (payload: PlayReportPayload) => void; audio: AudioControls }) {
    const [sequence, setSequence] = useState<number[]>([0])
    const [userIndex, setUserIndex] = useState(0)
    const [activePad, setActivePad] = useState<number | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [level, setLevel] = useState(1)
    const [best, setBest] = useState(1)

    const playPad = useCallback(
        (padIndex: number, duration = 220) => {
            setActivePad(padIndex)
            void audio.playTone(MUSIC_PADS[padIndex].freq, duration / 1000, 'triangle', 0.09)
            setTimeout(() => setActivePad((current) => (current === padIndex ? null : current)), duration)
        },
        [audio]
    )

    const playSequence = useCallback(
        async (seq: number[]) => {
            setIsPlaying(true)
            await sleep(250)
            for (const padIndex of seq) {
                playPad(padIndex, 260)
                await sleep(430)
            }
            setIsPlaying(false)
        },
        [playPad]
    )

    useEffect(() => {
        void playSequence(sequence)
    }, [playSequence, sequence])

    const handlePadClick = (padIndex: number) => {
        if (isPlaying) return
        playPad(padIndex, 180)

        if (padIndex !== sequence[userIndex]) {
            audio.playError()
            const reset = [Math.floor(Math.random() * MUSIC_PADS.length)]
            setSequence(reset)
            setUserIndex(0)
            setLevel(1)
            return
        }

        if (userIndex === sequence.length - 1) {
            const nextLevel = sequence.length + 1
            const nextSequence = [...sequence, Math.floor(Math.random() * MUSIC_PADS.length)]
            setLevel(nextLevel)
            setBest((prev) => Math.max(prev, nextLevel))
            setUserIndex(0)
            setSequence(nextSequence)
            onReportPlay({
                gameId: 'music',
                score: nextLevel * 20,
                accuracy: 100,
                durationSeconds: Math.max(6, nextLevel * 3),
                starsEarned: 4,
            })
            audio.playSuccess()
            return
        }

        setUserIndex((prev) => prev + 1)
    }

    return (
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-xl font-black text-slate-800">Nhắc Lại Giai Điệu</h3>
                <div className="text-xs font-black text-slate-500">Level {level} • Kỷ lục {best}</div>
            </div>
            <div className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
                Nghe mẫu rồi chạm đúng thứ tự nốt nhạc. Càng lên level càng dài!
            </div>
            <div className="grid grid-cols-2 gap-3">
                {MUSIC_PADS.map((pad, index) => (
                    <button
                        key={pad.label}
                        type="button"
                        disabled={isPlaying}
                        onClick={() => handlePadClick(index)}
                        className={cn(
                            'h-24 rounded-3xl text-lg font-black text-white shadow-md transition-all',
                            pad.color,
                            activePad === index && `${pad.active} ctm-pop`,
                            isPlaying && 'cursor-not-allowed opacity-90'
                        )}
                    >
                        {pad.label}
                    </button>
                ))}
            </div>
        </div>
    )
}

interface MazePos {
    x: number
    y: number
}

type MazeDirection = 'up' | 'right' | 'down' | 'left'
type MazeWallKey = 'top' | 'right' | 'bottom' | 'left'

interface MazeCellWalls {
    top: boolean
    right: boolean
    bottom: boolean
    left: boolean
}

interface MazeLevelConfig {
    size: number
    cheer: string
}

const MAZE_LEVELS: MazeLevelConfig[] = [
    { size: 5, cheer: 'Con đi thật khéo, tiến lên nào!' },
    { size: 6, cheer: 'Giỏi lắm, mình chinh phục màn tiếp theo nhé!' },
    { size: 7, cheer: 'Con tập trung rất tốt, cố lên nào!' },
    { size: 8, cheer: 'Siêu quá, con đang làm rất tuyệt!' },
    { size: 9, cheer: 'Màn khó rồi, nhưng con làm được mà!' },
]

const MAZE_DIRECTIONS: Record<MazeDirection, { dx: number; dy: number; wall: MazeWallKey; opposite: MazeWallKey; icon: string }> = {
    up: { dx: 0, dy: -1, wall: 'top', opposite: 'bottom', icon: '↑' },
    right: { dx: 1, dy: 0, wall: 'right', opposite: 'left', icon: '→' },
    down: { dx: 0, dy: 1, wall: 'bottom', opposite: 'top', icon: '↓' },
    left: { dx: -1, dy: 0, wall: 'left', opposite: 'right', icon: '←' },
}

function createSeededRandom(seed: number) {
    let state = (seed >>> 0) || 1
    return () => {
        state = (1664525 * state + 1013904223) >>> 0
        return state / 4294967296
    }
}

function buildMazeGrid(size: number, seed: number) {
    const rand = createSeededRandom(seed)
    const grid: MazeCellWalls[][] = Array.from({ length: size }, () =>
        Array.from({ length: size }, () => ({ top: true, right: true, bottom: true, left: true }))
    )
    const visited = Array.from({ length: size }, () => Array.from({ length: size }, () => false))
    const stack: MazePos[] = [{ x: 0, y: 0 }]
    visited[0][0] = true

    const directionList: MazeDirection[] = ['up', 'right', 'down', 'left']

    while (stack.length > 0) {
        const current = stack[stack.length - 1]
        const nextSteps = directionList
            .map((dir) => {
                const rule = MAZE_DIRECTIONS[dir]
                const nx = current.x + rule.dx
                const ny = current.y + rule.dy
                const inBounds = nx >= 0 && ny >= 0 && nx < size && ny < size
                if (!inBounds || visited[ny][nx]) return null
                return { dir, nx, ny }
            })
            .filter((item): item is { dir: MazeDirection; nx: number; ny: number } => item !== null)

        if (nextSteps.length === 0) {
            stack.pop()
            continue
        }

        const next = nextSteps[Math.floor(rand() * nextSteps.length)]
        const forward = MAZE_DIRECTIONS[next.dir]
        grid[current.y][current.x][forward.wall] = false
        grid[next.ny][next.nx][forward.opposite] = false
        visited[next.ny][next.nx] = true
        stack.push({ x: next.nx, y: next.ny })
    }

    return grid
}

function findHintDirection(maze: MazeCellWalls[][], start: MazePos, goal: MazePos) {
    const size = maze.length
    const queue: Array<{ x: number; y: number; first: MazeDirection | null }> = [{ x: start.x, y: start.y, first: null }]
    const visited = new Set([`${start.x},${start.y}`])
    const directionList: MazeDirection[] = ['up', 'right', 'down', 'left']

    while (queue.length > 0) {
        const current = queue.shift()
        if (!current) break
        if (current.x === goal.x && current.y === goal.y) return current.first

        for (const dir of directionList) {
            const rule = MAZE_DIRECTIONS[dir]
            if (maze[current.y][current.x][rule.wall]) continue
            const nx = current.x + rule.dx
            const ny = current.y + rule.dy
            const key = `${nx},${ny}`
            if (nx < 0 || ny < 0 || nx >= size || ny >= size || visited.has(key)) continue
            visited.add(key)
            queue.push({ x: nx, y: ny, first: current.first ?? dir })
        }
    }

    return null
}

function MazeRunnerGame({ onReportPlay, audio }: { onReportPlay: (payload: PlayReportPayload) => void; audio: AudioControls }) {
    const [mazeSeed, setMazeSeed] = useState(20260527)
    const [levelIndex, setLevelIndex] = useState(0)
    const [bestLevel, setBestLevel] = useState(0)
    const [pos, setPos] = useState<MazePos>({ x: 0, y: 0 })
    const [steps, setSteps] = useState(0)
    const [invalidMoves, setInvalidMoves] = useState(0)
    const [done, setDone] = useState(false)
    const [speechOn, setSpeechOn] = useState(true)
    const startRef = useRef(Date.now())
    const voiceListRef = useRef<SpeechSynthesisVoice[]>([])
    const level = MAZE_LEVELS[levelIndex]
    const mazeSize = level.size
    const goal = useMemo(() => ({ x: mazeSize - 1, y: mazeSize - 1 }), [mazeSize])
    const maze = useMemo(() => buildMazeGrid(mazeSize, mazeSeed + levelIndex * 97), [levelIndex, mazeSeed, mazeSize])

    const speakEncourage = useCallback((text: string) => {
        if (!speechOn || typeof window === 'undefined' || !('speechSynthesis' in window)) return
        const synth = window.speechSynthesis
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'vi-VN'
        utterance.rate = 0.98
        utterance.pitch = 1.07
        const voices = voiceListRef.current.length > 0 ? voiceListRef.current : synth.getVoices()
        const preferred =
            voices.find((v) => /google/i.test(v.name) && /vi/i.test(v.lang)) ??
            voices.find((v) => /vi/i.test(v.lang)) ??
            voices.find((v) => /google/i.test(v.name))
        if (preferred) utterance.voice = preferred
        synth.cancel()
        synth.speak(utterance)
    }, [speechOn])

    useEffect(() => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
        const synth = window.speechSynthesis
        const assignVoices = () => {
            voiceListRef.current = synth.getVoices()
        }
        assignVoices()
        synth.addEventListener('voiceschanged', assignVoices)
        return () => synth.removeEventListener('voiceschanged', assignVoices)
    }, [])

    useEffect(() => {
        speakEncourage(`Màn ${levelIndex + 1}. ${level.cheer}`)
    }, [level.cheer, levelIndex, speakEncourage])

    const canMove = useCallback((dir: MazeDirection) => {
        const rule = MAZE_DIRECTIONS[dir]
        const cell = maze[pos.y][pos.x]
        if (cell[rule.wall]) return false
        const nx = pos.x + rule.dx
        const ny = pos.y + rule.dy
        return nx >= 0 && ny >= 0 && nx < mazeSize && ny < mazeSize
    }, [maze, mazeSize, pos.x, pos.y])

    const hintDirection = useMemo(() => {
        if (done) return null
        return findHintDirection(maze, pos, goal)
    }, [done, goal, maze, pos])

    const resetRound = useCallback((resetProgress = false) => {
        if (resetProgress) {
            setLevelIndex(0)
            setBestLevel(0)
        }
        setMazeSeed((prev) => prev + 1)
        setPos({ x: 0, y: 0 })
        setSteps(0)
        setInvalidMoves(0)
        setDone(false)
        startRef.current = Date.now()
    }, [])

    const nextLevel = useCallback(() => {
        if (levelIndex >= MAZE_LEVELS.length - 1) {
            speakEncourage('Con đã hoàn thành tất cả màn mê cung. Xuất sắc lắm!')
            resetRound(true)
            return
        }
        setLevelIndex((prev) => prev + 1)
        setMazeSeed((prev) => prev + 13)
        setPos({ x: 0, y: 0 })
        setSteps(0)
        setInvalidMoves(0)
        setDone(false)
        startRef.current = Date.now()
    }, [levelIndex, resetRound, speakEncourage])

    const move = useCallback((dir: MazeDirection) => {
        if (done) return
        if (!canMove(dir)) {
            setInvalidMoves((prev) => prev + 1)
            audio.playError()
            return
        }

        const rule = MAZE_DIRECTIONS[dir]
        const nx = pos.x + rule.dx
        const ny = pos.y + rule.dy
        setPos({ x: nx, y: ny })
        setSteps((prev) => prev + 1)
        void audio.playTone(420, 0.08, 'square', 0.05)

        if (nx === goal.x && ny === goal.y) {
            setDone(true)
            setBestLevel((prev) => Math.max(prev, levelIndex + 1))
            audio.playSuccess()
            const duration = Math.max(8, Math.round((Date.now() - startRef.current) / 1000))
            const totalMoves = steps + 1 + invalidMoves
            const accuracy = Math.round(((steps + 1) / Math.max(totalMoves, 1)) * 100)
            onReportPlay({
                gameId: 'maze',
                score: Math.max(20, 120 + levelIndex * 20 - (steps + invalidMoves) * 3),
                accuracy,
                durationSeconds: duration,
                starsEarned: Math.min(20, 10 + levelIndex * 2),
            })
            if (levelIndex >= MAZE_LEVELS.length - 1) {
                speakEncourage('Con về đích rồi. Tuyệt vời, nhà vô địch mê cung!')
            } else {
                speakEncourage(`Giỏi quá! Con đã qua màn ${levelIndex + 1}.`)
            }
        }
    }, [audio, canMove, done, goal.x, goal.y, invalidMoves, levelIndex, onReportPlay, pos.x, pos.y, speakEncourage, steps])

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            const key = event.key.toLowerCase()
            const map: Record<string, MazeDirection> = {
                arrowup: 'up',
                arrowright: 'right',
                arrowdown: 'down',
                arrowleft: 'left',
                w: 'up',
                d: 'right',
                s: 'down',
                a: 'left',
            }
            const direction = map[key]
            if (!direction) return
            event.preventDefault()
            move(direction)
        }

        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [move])

    return (
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-xl font-black text-slate-800">Mê Cung Phiêu Lưu</h3>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setSpeechOn((prev) => !prev)}
                        className={cn(
                            'rounded-xl border px-3 py-2 text-xs font-black',
                            speechOn ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600'
                        )}
                    >
                        {speechOn ? '🔊 Giọng nói bật' : '🔈 Giọng nói tắt'}
                    </button>
                    <button
                        type="button"
                        onClick={() => resetRound(false)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"
                    >
                        Chơi lại màn
                    </button>
                </div>
            </div>
            <p className="mb-4 rounded-2xl bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700">
                Màn {levelIndex + 1}/{MAZE_LEVELS.length} • Dẫn chuột đến phô mai. Dùng phím mũi tên hoặc WASD.
            </p>
            <div className="flex flex-col items-center gap-6 w-full">
                <div className="touch-none rounded-3xl border-4 border-white bg-white/90 p-4 shadow-xl backdrop-blur-sm">
                    <div
                        className="relative"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${mazeSize}, 42px)`,
                            gridTemplateRows: `repeat(${mazeSize}, 42px)`,
                        }}
                    >
                        {Array.from({ length: mazeSize * mazeSize }, (_, idx) => {
                            const x = idx % mazeSize
                            const y = Math.floor(idx / mazeSize)
                            const key = `${x},${y}`
                            const isPlayer = pos.x === x && pos.y === y
                            const isGoal = goal.x === x && goal.y === y
                            const cell = maze[y][x]
                            const wallColor = 'rgb(67, 56, 202)'

                            return (
                                <div
                                    key={key}
                                    className="relative"
                                    style={{
                                        width: 42,
                                        height: 42,
                                        borderWidth: 3,
                                        borderStyle: 'solid',
                                        borderColor: `${cell.top ? wallColor : 'transparent'} ${cell.right ? wallColor : 'transparent'} ${cell.bottom ? wallColor : 'transparent'} ${cell.left ? wallColor : 'transparent'}`,
                                        backgroundColor: isGoal ? 'rgb(254, 249, 195)' : 'rgb(248, 250, 252)',
                                    }}
                                >
                                    {isPlayer ? (
                                        <div className="absolute inset-0 z-10 flex items-center justify-center transition-all duration-300">
                                            <div className="text-2xl" role="img" aria-label="player">🐭</div>
                                        </div>
                                    ) : null}
                                    {!isPlayer && isGoal ? (
                                        <div className="absolute inset-0 flex items-center justify-center animate-pulse text-2xl">🧀</div>
                                    ) : null}
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="grid w-fit grid-cols-3 gap-2">
                    <div />
                    <button
                        type="button"
                        disabled={done || !canMove('up')}
                        onClick={() => move('up')}
                        className={cn(
                            'h-16 w-16 rounded-2xl border-[3px] shadow-lg transition-all duration-200 active:scale-90 text-2xl',
                            done || !canMove('up')
                                ? 'cursor-not-allowed border-gray-300 bg-gray-200 text-gray-400'
                                : cn(
                                    'cursor-pointer border-indigo-600 bg-indigo-500 text-white hover:scale-105 hover:bg-indigo-600',
                                    hintDirection === 'up' && 'animate-pulse ring-4 ring-yellow-300'
                                )
                        )}
                    >
                        {MAZE_DIRECTIONS.up.icon}
                    </button>
                    <div />

                    <button
                        type="button"
                        disabled={done || !canMove('left')}
                        onClick={() => move('left')}
                        className={cn(
                            'h-16 w-16 rounded-2xl border-[3px] shadow-lg transition-all duration-200 active:scale-90 text-2xl',
                            done || !canMove('left')
                                ? 'cursor-not-allowed border-gray-300 bg-gray-200 text-gray-400'
                                : cn(
                                    'cursor-pointer border-indigo-600 bg-indigo-500 text-white hover:scale-105 hover:bg-indigo-600',
                                    hintDirection === 'left' && 'animate-pulse ring-4 ring-yellow-300'
                                )
                        )}
                    >
                        {MAZE_DIRECTIONS.left.icon}
                    </button>
                    <button
                        type="button"
                        disabled={done || !canMove('down')}
                        onClick={() => move('down')}
                        className={cn(
                            'h-16 w-16 rounded-2xl border-[3px] shadow-lg transition-all duration-200 active:scale-90 text-2xl',
                            done || !canMove('down')
                                ? 'cursor-not-allowed border-gray-300 bg-gray-200 text-gray-400'
                                : cn(
                                    'cursor-pointer border-indigo-600 bg-indigo-500 text-white hover:scale-105 hover:bg-indigo-600',
                                    hintDirection === 'down' && 'animate-pulse ring-4 ring-yellow-300'
                                )
                        )}
                    >
                        {MAZE_DIRECTIONS.down.icon}
                    </button>
                    <button
                        type="button"
                        disabled={done || !canMove('right')}
                        onClick={() => move('right')}
                        className={cn(
                            'h-16 w-16 rounded-2xl border-[3px] shadow-lg transition-all duration-200 active:scale-90 text-2xl',
                            done || !canMove('right')
                                ? 'cursor-not-allowed border-gray-300 bg-gray-200 text-gray-400'
                                : cn(
                                    'cursor-pointer border-indigo-600 bg-indigo-500 text-white hover:scale-105 hover:bg-indigo-600',
                                    hintDirection === 'right' && 'animate-pulse ring-4 ring-yellow-300'
                                )
                        )}
                    >
                        {MAZE_DIRECTIONS.right.icon}
                    </button>
                </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs font-bold text-slate-500">Bước đi: {steps} • Chạm tường: {invalidMoves} • Màn cao nhất: {bestLevel}/{MAZE_LEVELS.length}</p>
                {done ? (
                    <button
                        type="button"
                        onClick={nextLevel}
                        className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-black text-white hover:bg-indigo-700"
                    >
                        {levelIndex >= MAZE_LEVELS.length - 1 ? 'Chơi lại từ màn 1' : 'Qua màn tiếp theo'}
                    </button>
                ) : null}
            </div>
        </div>
    )
}

const TARGET_COLORS = [
    { name: 'Cam', rgb: [242, 132, 28] as const },
    { name: 'Xanh lá', rgb: [52, 168, 83] as const },
    { name: 'Tím', rgb: [125, 80, 184] as const },
]

function mixRgb(red: number, yellow: number, blue: number) {
    const total = Math.max(1, red + yellow + blue)
    const rn = red / total
    const yn = yellow / total
    const bn = blue / total
    const r = Math.round(230 * rn + 245 * yn + 85 * bn)
    const g = Math.round(40 * rn + 205 * yn + 70 * bn)
    const b = Math.round(40 * rn + 40 * yn + 220 * bn)
    return [r, g, b] as const
}

function colorDistance(a: readonly number[], b: readonly number[]) {
    return Math.sqrt(
        Math.pow(a[0] - b[0], 2) +
        Math.pow(a[1] - b[1], 2) +
        Math.pow(a[2] - b[2], 2)
    )
}

function ColorMixGame({ onReportPlay, audio }: { onReportPlay: (payload: PlayReportPayload) => void; audio: AudioControls }) {
    const [red, setRed] = useState(35)
    const [yellow, setYellow] = useState(35)
    const [blue, setBlue] = useState(30)
    const [target, setTarget] = useState(TARGET_COLORS[0])
    const startRef = useRef(Date.now())

    const mixed = mixRgb(red, yellow, blue)
    const distance = colorDistance(mixed, target.rgb)
    const score = Math.max(0, Math.round(100 - distance / 2))

    const reset = useCallback(() => {
        setRed(35)
        setYellow(35)
        setBlue(30)
        setTarget(TARGET_COLORS[Math.floor(Math.random() * TARGET_COLORS.length)])
        startRef.current = Date.now()
    }, [])

    const checkResult = () => {
        const success = score >= 80
        if (!success) {
            audio.playError()
            return
        }
        audio.playSuccess()
        const duration = Math.max(8, Math.round((Date.now() - startRef.current) / 1000))
        onReportPlay({
            gameId: 'color',
            score,
            accuracy: score,
            durationSeconds: duration,
            starsEarned: 10,
        })
        setTimeout(() => reset(), 700)
    }

    return (
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-xl font-black text-slate-800">Pha Màu Kỳ Diệu</h3>
                <button
                    type="button"
                    onClick={reset}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"
                >
                    Màu mới
                </button>
            </div>
            <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                Hãy pha để giống màu mục tiêu: <span className="underline">{target.name}</span>
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-3">
                    <label className="block text-sm font-bold text-red-600">
                        Đỏ: {red}
                        <input className="mt-1 w-full" type="range" min={0} max={100} value={red} onChange={(e) => setRed(Number(e.target.value))} />
                    </label>
                    <label className="block text-sm font-bold text-amber-600">
                        Vàng: {yellow}
                        <input className="mt-1 w-full" type="range" min={0} max={100} value={yellow} onChange={(e) => setYellow(Number(e.target.value))} />
                    </label>
                    <label className="block text-sm font-bold text-blue-600">
                        Xanh dương: {blue}
                        <input className="mt-1 w-full" type="range" min={0} max={100} value={blue} onChange={(e) => setBlue(Number(e.target.value))} />
                    </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-xs font-black text-slate-500">Mục tiêu</p>
                        <div className="mt-2 h-24 rounded-2xl border border-slate-200" style={{ backgroundColor: `rgb(${target.rgb[0]},${target.rgb[1]},${target.rgb[2]})` }} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-500">Bé pha</p>
                        <div className="mt-2 h-24 rounded-2xl border border-slate-200" style={{ backgroundColor: `rgb(${mixed[0]},${mixed[1]},${mixed[2]})` }} />
                    </div>
                </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-sm font-black text-slate-700">Độ khớp màu: {score}%</p>
                <button type="button" onClick={checkResult} className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-black text-white hover:bg-rose-600">
                    Hoàn thành
                </button>
            </div>
        </div>
    )
}

const GAME_TABS: Array<{ id: GameId; emoji: string; title: string; desc: string }> = [
    { id: 'number', emoji: '🔢', title: 'Toán Học', desc: 'Bắt số nhanh' },
    { id: 'memory', emoji: '🧠', title: 'Tư Duy', desc: 'Lật thẻ ghi nhớ' },
    { id: 'music', emoji: '🎵', title: 'Âm Nhạc', desc: 'Nhắc lại giai điệu' },
    { id: 'maze', emoji: '🧭', title: 'Kỹ Năng Sống', desc: 'Mê cung phiêu lưu' },
    { id: 'color', emoji: '🎨', title: 'Mỹ Thuật', desc: 'Pha màu kỳ diệu' },
]

const GAME_NODE_STYLES: Record<GameId, { ring: string; ribbon: string }> = {
    number: { ring: 'border-orange-400', ribbon: 'from-violet-500 to-violet-700' },
    memory: { ring: 'border-orange-400', ribbon: 'from-rose-500 to-rose-700' },
    music: { ring: 'border-orange-400', ribbon: 'from-red-500 to-red-700' },
    maze: { ring: 'border-orange-400', ribbon: 'from-cyan-500 to-cyan-700' },
    color: { ring: 'border-orange-400', ribbon: 'from-purple-500 to-purple-700' },
}

interface GameSubOption {
    key: string
    label: string
    emoji: string
    gameId: GameId
}

interface GameMapNode {
    key: string
    label: string
    emoji: string
    gameId: GameId
    top: string
    left: string
    subs: GameSubOption[]
}

const GAME_MAP_NODES: GameMapNode[] = [
    {
        key: 'logic',
        label: 'Tư Duy',
        emoji: '🧠',
        gameId: 'memory',
        top: '28%',
        left: '17%',
        subs: [
            { key: 'logic-rules', label: 'Quy Luật', emoji: '🧩', gameId: 'memory' },
            { key: 'logic-diff', label: 'Điểm khác biệt', emoji: '🔍', gameId: 'memory' },
            { key: 'logic-shape', label: 'Hình khác biệt', emoji: '🔶', gameId: 'memory' },
            { key: 'logic-connect', label: 'Nối điểm trí tuệ', emoji: '🧷', gameId: 'maze' },
            { key: 'logic-maze', label: 'Mê Cung', emoji: '🧭', gameId: 'maze' },
        ],
    },
    {
        key: 'art',
        label: 'Mỹ Thuật',
        emoji: '🎨',
        gameId: 'color',
        top: '28%',
        left: '41%',
        subs: [
            { key: 'art-mix', label: 'Pha màu', emoji: '🎨', gameId: 'color' },
            { key: 'art-guess', label: 'Phối sắc', emoji: '🖌️', gameId: 'color' },
            { key: 'art-memory', label: 'Màu ghi nhớ', emoji: '🌈', gameId: 'memory' },
        ],
    },
    {
        key: 'life',
        label: 'Kỹ Năng Sống',
        emoji: '🧭',
        gameId: 'maze',
        top: '28%',
        left: '64%',
        subs: [
            { key: 'life-maze', label: 'Đường về nhà', emoji: '🏠', gameId: 'maze' },
            { key: 'life-route', label: 'Chọn lối an toàn', emoji: '🛣️', gameId: 'maze' },
            { key: 'life-memory', label: 'Tình huống đúng', emoji: '✅', gameId: 'memory' },
        ],
    },
    {
        key: 'geo',
        label: 'Địa Lý',
        emoji: '🌍',
        gameId: 'maze',
        top: '28%',
        left: '86%',
        subs: [
            { key: 'geo-map', label: 'Bản đồ nhỏ', emoji: '🗺️', gameId: 'maze' },
            { key: 'geo-place', label: 'Địa danh', emoji: '🏞️', gameId: 'memory' },
            { key: 'geo-flag', label: 'Cờ quốc gia', emoji: '🏳️', gameId: 'memory' },
        ],
    },
    {
        key: 'music',
        label: 'Âm Nhạc',
        emoji: '🎵',
        gameId: 'music',
        top: '55%',
        left: '18%',
        subs: [
            { key: 'music-repeat', label: 'Nhắc giai điệu', emoji: '🎵', gameId: 'music' },
            { key: 'music-note', label: 'Nốt nhạc', emoji: '🎼', gameId: 'music' },
            { key: 'music-quick', label: 'Nghe nhanh', emoji: '🎧', gameId: 'music' },
        ],
    },
    {
        key: 'science',
        label: 'Khoa Học',
        emoji: '🔬',
        gameId: 'memory',
        top: '55%',
        left: '41%',
        subs: [
            { key: 'sci-find', label: 'Tìm cặp thí nghiệm', emoji: '🔬', gameId: 'memory' },
            { key: 'sci-order', label: 'Sắp xếp quy trình', emoji: '⚗️', gameId: 'number' },
            { key: 'sci-maze', label: 'Khám phá tự nhiên', emoji: '🌿', gameId: 'maze' },
        ],
    },
    {
        key: 'language',
        label: 'Ngôn Ngữ',
        emoji: '🔤',
        gameId: 'memory',
        top: '55%',
        left: '64%',
        subs: [
            { key: 'lang-alphabet', label: 'Bảng chữ cái', emoji: '🔤', gameId: 'memory' },
            { key: 'lang-word', label: 'Ghép từ', emoji: '📝', gameId: 'number' },
            { key: 'lang-sound', label: 'Nghe và chọn', emoji: '🔊', gameId: 'music' },
        ],
    },
    {
        key: 'math',
        label: 'Toán Học',
        emoji: '🔢',
        gameId: 'number',
        top: '55%',
        left: '86%',
        subs: [
            { key: 'math-fast', label: 'Bắt số', emoji: '🔢', gameId: 'number' },
            { key: 'math-memory', label: 'Số ghi nhớ', emoji: '🧠', gameId: 'memory' },
            { key: 'math-maze', label: 'Lối đi phép tính', emoji: '➕', gameId: 'maze' },
        ],
    },
    {
        key: 'english',
        label: 'Tiếng Anh',
        emoji: '🇬🇧',
        gameId: 'music',
        top: '83%',
        left: '52%',
        subs: [
            { key: 'eng-song', label: 'Nhịp điệu từ vựng', emoji: '🎤', gameId: 'music' },
            { key: 'eng-word', label: 'Từ vựng nhanh', emoji: '📚', gameId: 'memory' },
            { key: 'eng-spell', label: 'Đánh vần', emoji: '🔠', gameId: 'number' },
        ],
    },
]

export default function ChildGamesPage() {
    const supabase = useMemo(() => createClient(), [])
    const audio = useAudioControls()
    const [stars, setStars] = useState(0)
    const [currentStreak, setCurrentStreak] = useState(0)
    const [bestStreak, setBestStreak] = useState(0)
    const [childId, setChildId] = useState<string | null>(null)
    const [activeGame, setActiveGame] = useState<GameId>('number')
    const [focusedNodeKey, setFocusedNodeKey] = useState<string | null>(null)

    useEffect(() => {
        const saved = window.localStorage.getItem(STAR_KEY)
        setStars(Number(saved || 0))
    }, [])

    useEffect(() => {
        async function loadUser() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) setChildId(user.id)
        }
        void loadUser()
    }, [supabase])

    const addLocalStars = useCallback((value: number) => {
        setStars((prev) => {
            const next = prev + value
            window.localStorage.setItem(STAR_KEY, String(next))
            return next
        })
    }, [])

    const reportPlay = useCallback(async (payload: PlayReportPayload) => {
        if (!childId) {
            addLocalStars(payload.starsEarned)
            return
        }
        try {
            const result = await api.miniGames.play({
                childId,
                gameId: payload.gameId,
                score: payload.score,
                accuracy: payload.accuracy,
                durationSeconds: payload.durationSeconds,
                starsEarned: payload.starsEarned,
            })
            setStars(result.totalStars)
            setCurrentStreak(result.currentStreak)
            setBestStreak(result.bestStreak)
            window.localStorage.setItem(STAR_KEY, String(result.totalStars))
        } catch {
            addLocalStars(payload.starsEarned)
        }
    }, [addLocalStars, childId])

    const activeGameContent = useMemo(() => {
        if (activeGame === 'number') return <NumberChaseGame onReportPlay={reportPlay} audio={audio} />
        if (activeGame === 'memory') return <MemoryFlipGame onReportPlay={reportPlay} audio={audio} />
        if (activeGame === 'maze') return <MazeRunnerGame onReportPlay={reportPlay} audio={audio} />
        if (activeGame === 'color') return <ColorMixGame onReportPlay={reportPlay} audio={audio} />
        return <MusicPatternGame onReportPlay={reportPlay} audio={audio} />
    }, [activeGame, audio, reportPlay])

    const selectedMeta = useMemo(() => {
        return GAME_TABS.find((item) => item.id === activeGame) ?? GAME_TABS[0]
    }, [activeGame])

    return (
        <div className="min-h-screen bg-[#b7dbe4] py-6 px-3 sm:px-5">
            <div className="mx-auto max-w-[1400px] space-y-5">
                <section className="rounded-[1.8rem] border-4 border-white/80 bg-[#ece5d5] px-5 py-3 shadow-[0_8px_0_rgba(255,255,255,0.45)]">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="text-5xl leading-none">🦉</div>
                            <div>
                                <p className="text-3xl font-black text-sky-700">Mindory Kids</p>
                                <p className="text-xs font-bold text-sky-600">Kho trò chơi tương tác</p>
                            </div>
                        </div>
                        <div className="rounded-full border-2 border-sky-200 bg-white px-4 py-2">
                            <p className="text-sm font-black text-sky-700">⭐ {stars} • 🔥 {currentStreak} • 🏅 {bestStreak}</p>
                        </div>
                    </div>
                </section>

                <section className="mx-auto w-full max-w-[980px] rounded-[2rem] border-4 border-white/80 bg-[#c9e7f2] p-3 shadow-xl">
                    <div className="relative overflow-hidden rounded-[1.7rem] border-2 border-white/70 bg-gradient-to-b from-[#c7ecfb] via-[#dff6cc] to-[#c1e787] h-[600px] sm:h-[680px]">
                        <div className="absolute left-8 top-8 h-8 w-24 rounded-full bg-white/70 blur-sm" />
                        <div className="absolute right-12 top-16 h-10 w-28 rounded-full bg-white/70 blur-sm" />
                        <div className="absolute left-1/3 top-10 text-7xl opacity-80">🌈</div>
                        <div className="absolute right-14 top-8 text-5xl ctm-float">🎈</div>

                        <svg viewBox="0 0 1000 680" className="absolute inset-0 h-full w-full opacity-45">
                            <path d="M70 640 C140 560, 240 600, 320 540 C390 485, 475 520, 560 460 C650 398, 760 430, 860 370 C900 345, 930 330, 965 305" stroke="#d8c783" strokeWidth="22" fill="none" strokeLinecap="round" />
                            <path d="M90 470 C170 430, 230 420, 320 430 C430 442, 500 420, 590 370 C690 315, 760 324, 900 282" stroke="#e8da9d" strokeWidth="22" fill="none" strokeLinecap="round" />
                            <path d="M85 320 C175 285, 255 278, 340 302 C420 324, 535 290, 620 250 C700 213, 786 230, 905 220" stroke="#dcca84" strokeWidth="22" fill="none" strokeLinecap="round" />
                        </svg>

                        {GAME_MAP_NODES.map((node) => {
                            const isActive = activeGame === node.gameId
                            const styleSet = GAME_NODE_STYLES[node.gameId]
                            const isFocused = focusedNodeKey === node.key
                            const hasFocusMode = Boolean(focusedNodeKey)
                            const isGhosted = Boolean(hasFocusMode && !isFocused)

                            return (
                                <div
                                    key={node.key}
                                    className={cn(
                                        'absolute -translate-x-1/2 -translate-y-1/2 relative flex items-center justify-center isolate transition-all duration-500 ease-out',
                                        isGhosted && 'opacity-30 blur-[2px] grayscale-[30%] scale-95 pointer-events-none',
                                        isFocused && 'z-50'
                                    )}
                                    style={{ top: node.top, left: node.left }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveGame(node.gameId)
                                            setFocusedNodeKey((prev) => (prev === node.key ? null : node.key))
                                        }}
                                        className={cn(
                                            'relative z-30 flex h-24 w-24 sm:h-32 sm:w-32 items-center justify-center rounded-full border-4 bg-white drop-shadow-xl transition-all duration-300',
                                            styleSet.ring,
                                            isFocused ? 'scale-110 ring-4 ring-orange-300 ring-offset-2' : 'hover:scale-[1.05]',
                                            isActive && !isFocused && 'ring-4 ring-yellow-200'
                                        )}
                                    >
                                        <div className="text-5xl sm:text-6xl">{node.emoji}</div>
                                        <div className={cn('absolute -bottom-1 left-1/2 min-w-[86px] -translate-x-1/2 rounded-full bg-gradient-to-r px-3 py-1 text-center text-[11px] font-black text-white shadow-md', styleSet.ribbon)}>
                                            {node.label}
                                        </div>
                                    </button>

                                    <div className={cn('absolute inset-0 m-auto h-full w-full pointer-events-none z-20 transition-opacity duration-500', isFocused ? 'opacity-100' : 'opacity-0')}>
                                        {node.subs.map((sub, index) => {
                                            const ring = GAME_NODE_STYLES[sub.gameId].ring
                                            const ribbon = GAME_NODE_STYLES[sub.gameId].ribbon
                                            const angle = ((-90 + (index * 360) / node.subs.length) * Math.PI) / 180
                                            const radius = 130
                                            const x = Math.cos(angle) * radius
                                            const y = Math.sin(angle) * radius
                                            const hiddenScale = 0.2

                                            return (
                                                <button
                                                    key={sub.key}
                                                    type="button"
                                                    onClick={() => setActiveGame(sub.gameId)}
                                                    className="absolute inset-0 m-auto h-16 w-16 sm:h-20 sm:w-20 transition-all duration-500 ease-out"
                                                    style={{
                                                        transform: `translate(${isFocused ? x : 0}px, ${isFocused ? y : 0}px) scale(${isFocused ? 1 : hiddenScale})`,
                                                        transitionDelay: `${isFocused ? 70 + index * 55 : 0}ms`,
                                                        pointerEvents: isFocused ? 'auto' : 'none',
                                                    }}
                                                >
                                                    <div className={cn('relative h-full w-full rounded-full border-2 bg-white shadow-xl flex items-center justify-center transition-transform hover:scale-110', ring)}>
                                                        <span className="text-2xl sm:text-3xl">{sub.emoji}</span>
                                                    </div>
                                                    <div className={cn('absolute -bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r px-3 py-1 text-xs font-bold text-white shadow-md', ribbon)}>
                                                        {sub.label}
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>

                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={audio.toggleMusic}
                        className={cn(
                            'rounded-2xl px-5 py-2 text-sm font-black shadow-lg transition',
                            audio.musicOn ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-white hover:bg-slate-800'
                        )}
                    >
                        {audio.musicOn ? '🔊 Đang bật nhạc' : '🔈 Bật nhạc nền'}
                    </button>
                </div>

                <section className="rounded-[1.6rem] border-2 border-white/80 bg-white/90 p-4 shadow-xl">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-700">
                            {selectedMeta.emoji} {selectedMeta.title}
                        </span>
                        <span className="text-xs font-bold text-slate-500">{selectedMeta.desc}</span>
                    </div>
                    <div key={activeGame} className="ctm-fade-up">
                        {activeGameContent}
                    </div>
                </section>
            </div>
        </div>
    )
}
