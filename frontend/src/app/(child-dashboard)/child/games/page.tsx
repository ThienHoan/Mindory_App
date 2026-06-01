'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
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
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
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
            const ctx = audioContextRef.current
            audioContextRef.current = null
            if (ctx && ctx.state !== 'closed') {
                void ctx.close().catch(() => undefined)
            }
        }
    }, [stopMusic])

    return { musicOn, toggleMusic, playTone, playSuccess, playError }
}

interface MathQuestion {
    prompt: string
    options: [string, string, string, string]
    correctIndex: number
    voiceText?: string
}

interface MathLevel {
    title: string
    cheer: string
    stars: number
    questions: MathQuestion[]
}

const MATH_LEVELS: MathLevel[] = [
    {
        title: 'Màn 1: Đếm số',
        cheer: 'Mình bắt đầu với đếm số nhé!',
        stars: 6,
        questions: [
            { prompt: 'Số nào đứng sau số 8?', options: ['6', '7', '9', '10'], correctIndex: 2 },
            { prompt: 'Số nào đứng trước số 15?', options: ['12', '14', '16', '18'], correctIndex: 1 },
            { prompt: 'Điền số còn thiếu: 2, 4, 6, ?', options: ['7', '8', '9', '10'], correctIndex: 1 },
            { prompt: 'Số lớn nhất là số nào?', options: ['11', '9', '13', '10'], correctIndex: 2 },
        ],
    },
    {
        title: 'Màn 2: So sánh',
        cheer: 'Giờ mình học lớn hơn, nhỏ hơn nào!',
        stars: 7,
        questions: [
            { prompt: 'Chọn dấu đúng: 12 __ 9', options: ['<', '>', '=', '?'], correctIndex: 1 },
            { prompt: 'Chọn dấu đúng: 7 __ 7', options: ['<', '>', '=', '+'], correctIndex: 2 },
            { prompt: 'Số nào bé hơn 20?', options: ['22', '21', '19', '24'], correctIndex: 2 },
            { prompt: 'Số nào lớn hơn 35?', options: ['30', '29', '33', '40'], correctIndex: 3 },
        ],
    },
    {
        title: 'Màn 3: Hình dạng',
        cheer: 'Bây giờ nhận biết các hình cơ bản nhé!',
        stars: 8,
        questions: [
            { prompt: 'Hình có 3 cạnh là hình gì?', options: ['Hình vuông', 'Hình tam giác', 'Hình tròn', 'Hình chữ nhật'], correctIndex: 1 },
            { prompt: 'Hình nào không có cạnh?', options: ['Hình tròn', 'Hình tam giác', 'Hình vuông', 'Hình ngũ giác'], correctIndex: 0 },
            { prompt: 'Hình vuông có mấy cạnh?', options: ['2', '3', '4', '5'], correctIndex: 2 },
            { prompt: 'Hình chữ nhật có mấy góc vuông?', options: ['1', '2', '3', '4'], correctIndex: 3 },
        ],
    },
    {
        title: 'Màn 4: Cộng trừ',
        cheer: 'Mình làm phép cộng trừ đơn giản nha!',
        stars: 9,
        questions: [
            { prompt: '7 + 5 = ?', options: ['11', '12', '13', '14'], correctIndex: 1 },
            { prompt: '15 - 6 = ?', options: ['7', '8', '9', '10'], correctIndex: 2 },
            { prompt: '9 + 8 = ?', options: ['15', '16', '17', '18'], correctIndex: 2 },
            { prompt: '20 - 9 = ?', options: ['9', '10', '11', '12'], correctIndex: 2 },
        ],
    },
    {
        title: 'Màn 5: Phép nhân',
        cheer: 'Tiếp theo là bảng nhân nhé!',
        stars: 10,
        questions: [
            { prompt: '3 × 4 = ?', options: ['7', '10', '12', '14'], correctIndex: 2 },
            { prompt: '5 × 2 = ?', options: ['8', '10', '12', '15'], correctIndex: 1 },
            { prompt: '6 × 3 = ?', options: ['15', '16', '17', '18'], correctIndex: 3 },
            { prompt: '9 × 2 = ?', options: ['18', '16', '14', '12'], correctIndex: 0 },
        ],
    },
    {
        title: 'Màn 6: Phép chia',
        cheer: 'Màn cuối rồi, mình chia số thật tốt nào!',
        stars: 12,
        questions: [
            { prompt: '12 ÷ 3 = ?', options: ['3', '4', '5', '6'], correctIndex: 1 },
            { prompt: '18 ÷ 2 = ?', options: ['7', '8', '9', '10'], correctIndex: 2 },
            { prompt: '20 ÷ 5 = ?', options: ['2', '3', '4', '5'], correctIndex: 2 },
            { prompt: '24 ÷ 6 = ?', options: ['2', '3', '4', '5'], correctIndex: 2 },
        ],
    },
]

function NumberChaseGame({
    onReportPlay,
    audio,
    startLevel = 0,
}: {
    onReportPlay: (payload: PlayReportPayload) => void
    audio: AudioControls
    startLevel?: number
}) {
    const safeStartLevel = Math.min(Math.max(0, startLevel), MATH_LEVELS.length - 1)
    const [levelIndex, setLevelIndex] = useState(safeStartLevel)
    const [questionIndex, setQuestionIndex] = useState(0)
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
    const [correctCount, setCorrectCount] = useState(0)
    const [wrongCount, setWrongCount] = useState(0)
    const [feedback, setFeedback] = useState('Chọn đáp án đúng trong các ô nhé!')
    const [completedLevel, setCompletedLevel] = useState(false)
    const [speechOn, setSpeechOn] = useState(true)
    const voiceListRef = useRef<SpeechSynthesisVoice[]>([])
    const nextQuestionTimerRef = useRef<number | null>(null)
    const levelStartRef = useRef(0)

    const level = MATH_LEVELS[levelIndex]
    const question = level.questions[questionIndex]
    const isFinalLevel = levelIndex >= MATH_LEVELS.length - 1
    const globalProgress = Math.round((((levelIndex * level.questions.length) + questionIndex) / (MATH_LEVELS.length * level.questions.length)) * 100)

    const speakText = useCallback((text: string) => {
        if (!speechOn || typeof window === 'undefined' || !('speechSynthesis' in window)) return
        const synth = window.speechSynthesis
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'vi-VN'
        utterance.rate = 0.95
        utterance.pitch = 1.06
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
        levelStartRef.current = Date.now()
    }, [])

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
        speakText(`${level.title}. ${level.cheer}`)
    }, [level.cheer, level.title, speakText])

    useEffect(() => {
        if (completedLevel) return
        const text = question.voiceText ?? `Câu ${questionIndex + 1}. ${question.prompt}`
        speakText(text)
    }, [completedLevel, question, questionIndex, speakText])

    useEffect(() => {
        return () => {
            if (nextQuestionTimerRef.current !== null) {
                window.clearTimeout(nextQuestionTimerRef.current)
            }
        }
    }, [])

    const reportLevel = useCallback((finalCorrectCount: number, finalWrongCount: number) => {
        const totalQuestions = level.questions.length
        const accuracy = Math.round((finalCorrectCount / totalQuestions) * 100)
        const duration = Math.max(8, Math.round((Date.now() - levelStartRef.current) / 1000))
        const score = Math.max(25, finalCorrectCount * 30 - finalWrongCount * 5 + levelIndex * 20)
        const starsEarned = Math.max(4, Math.round((level.stars * accuracy) / 100))

        onReportPlay({
            gameId: 'number',
            score,
            accuracy,
            durationSeconds: duration,
            starsEarned,
        })
    }, [level.questions.length, level.stars, levelIndex, onReportPlay])

    const resetLevel = useCallback(() => {
        setQuestionIndex(0)
        setSelectedIndex(null)
        setCorrectCount(0)
        setWrongCount(0)
        setCompletedLevel(false)
        setFeedback('Chọn đáp án đúng trong các ô nhé!')
        levelStartRef.current = Date.now()
    }, [])

    const resetAll = useCallback(() => {
        setLevelIndex(0)
        setQuestionIndex(0)
        setSelectedIndex(null)
        setCorrectCount(0)
        setWrongCount(0)
        setCompletedLevel(false)
        setFeedback('Chọn đáp án đúng trong các ô nhé!')
        levelStartRef.current = Date.now()
    }, [])

    const goToNextLevel = useCallback(() => {
        if (isFinalLevel) {
            resetAll()
            return
        }
        setLevelIndex((prev) => prev + 1)
        setQuestionIndex(0)
        setSelectedIndex(null)
        setCorrectCount(0)
        setWrongCount(0)
        setCompletedLevel(false)
        setFeedback('Chọn đáp án đúng trong các ô nhé!')
        levelStartRef.current = Date.now()
    }, [isFinalLevel, resetAll])

    const handleSelect = (index: number) => {
        if (selectedIndex !== null || completedLevel) return
        setSelectedIndex(index)

        const isCorrect = index === question.correctIndex
        const nextCorrectCount = isCorrect ? correctCount + 1 : correctCount
        const nextWrongCount = isCorrect ? wrongCount : wrongCount + 1
        if (isCorrect) {
            audio.playSuccess()
            setCorrectCount(nextCorrectCount)
            setFeedback('Chính xác rồi! Bé làm rất tốt!')
            speakText('Đúng rồi, giỏi lắm con!')
        } else {
            audio.playError()
            setWrongCount(nextWrongCount)
            setFeedback(`Chưa đúng. Đáp án đúng là: ${question.options[question.correctIndex]}.`)
            speakText(`Mình thử lại nhé. Đáp án đúng là ${question.options[question.correctIndex]}.`)
        }

        nextQuestionTimerRef.current = window.setTimeout(() => {
            const isLastQuestion = questionIndex >= level.questions.length - 1
            if (isLastQuestion) {
                setCompletedLevel(true)
                reportLevel(nextCorrectCount, nextWrongCount)
                if (isFinalLevel) {
                    speakText('Con đã hoàn thành toàn bộ màn toán học. Tuyệt vời!')
                } else {
                    speakText(`Con đã xong ${level.title}. Chuẩn bị qua màn mới nhé!`)
                }
            } else {
                setQuestionIndex((prev) => prev + 1)
                setSelectedIndex(null)
                setFeedback('Chọn đáp án đúng trong các ô nhé!')
            }
        }, 900)
    }

    return (
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-xl font-black text-slate-800">Toán Học Nhiều Màn</h3>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setSpeechOn((prev) => !prev)}
                        className={cn(
                            'rounded-xl border px-3 py-2 text-xs font-black',
                            speechOn ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-600'
                        )}
                    >
                        {speechOn ? '🔊 Chị Google bật' : '🔈 Chị Google tắt'}
                    </button>
                    <button
                        type="button"
                        onClick={resetLevel}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"
                    >
                        Chơi lại màn
                    </button>
                </div>
            </div>

            <div className="mb-4 rounded-2xl bg-indigo-50 px-4 py-3">
                <p className="text-sm font-black text-indigo-700">{level.title}</p>
                <p className="mt-1 text-xs font-bold text-indigo-500">
                    Câu {questionIndex + 1}/{level.questions.length} • Màn {levelIndex + 1}/{MATH_LEVELS.length} • Tiến độ {globalProgress}%
                </p>
            </div>

            {!completedLevel ? (
                <>
                    <div className="rounded-2xl bg-sky-50 px-4 py-4">
                        <p className="text-lg font-black text-slate-800">{question.prompt}</p>
                        <button
                            type="button"
                            onClick={() => speakText(question.voiceText ?? question.prompt)}
                            className="mt-2 rounded-full bg-white px-3 py-1 text-xs font-black text-sky-600 hover:bg-sky-100"
                        >
                            🔁 Đọc lại câu hỏi
                        </button>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {question.options.map((option, index) => {
                            let style = 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'
                            if (selectedIndex !== null) {
                                if (index === question.correctIndex) style = 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                else if (index === selectedIndex) style = 'border-rose-300 bg-rose-50 text-rose-700'
                                else style = 'border-slate-100 bg-slate-50 text-slate-400'
                            }
                            return (
                                <button
                                    key={option}
                                    type="button"
                                    disabled={selectedIndex !== null}
                                    onClick={() => handleSelect(index)}
                                    className={cn('min-h-20 rounded-2xl border-2 px-4 py-3 text-left text-base font-black transition-all', style)}
                                >
                                    {option}
                                </button>
                            )
                        })}
                    </div>

                    <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">{feedback}</p>
                </>
            ) : (
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                    <p className="text-sm font-black uppercase tracking-widest text-emerald-600">Hoàn thành màn</p>
                    <h4 className="mt-1 text-2xl font-black text-emerald-700">{level.title}</h4>
                    <p className="mt-3 text-sm font-bold text-emerald-700">
                        Bé đúng {correctCount}/{level.questions.length} câu • Sai {wrongCount} câu
                    </p>
                    <button
                        type="button"
                        onClick={goToNextLevel}
                        className="mt-5 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700"
                    >
                        {isFinalLevel ? 'Chơi lại từ màn 1' : 'Qua màn tiếp theo'}
                    </button>
                </div>
            )}
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

function MemoryFlipGame({
    onReportPlay,
    audio,
    startLevel = 0,
}: {
    onReportPlay: (payload: PlayReportPayload) => void
    audio: AudioControls
    startLevel?: number
}) {
    const safeStartLevel = Math.min(Math.max(0, startLevel), MEMORY_LEVELS.length - 1)
    const [levelIndex, setLevelIndex] = useState(safeStartLevel)
    const [bestLevel, setBestLevel] = useState(safeStartLevel)
    const [speechOn, setSpeechOn] = useState(true)
    const [cards, setCards] = useState<MemoryCard[]>(() => createMemoryCards(MEMORY_LEVELS[safeStartLevel].pairs))
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

function MusicPatternGame({
    onReportPlay,
    audio,
    startLevel = 1,
}: {
    onReportPlay: (payload: PlayReportPayload) => void
    audio: AudioControls
    startLevel?: number
}) {
    const safeStartLevel = Math.max(1, startLevel)
    const [sequence, setSequence] = useState<number[]>(() =>
        Array.from({ length: safeStartLevel }, () => Math.floor(Math.random() * MUSIC_PADS.length))
    )
    const [userIndex, setUserIndex] = useState(0)
    const [activePad, setActivePad] = useState<number | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [level, setLevel] = useState(safeStartLevel)
    const [best, setBest] = useState(safeStartLevel)

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

function MazeRunnerGame({
    onReportPlay,
    audio,
    startLevel = 0,
}: {
    onReportPlay: (payload: PlayReportPayload) => void
    audio: AudioControls
    startLevel?: number
}) {
    const safeStartLevel = Math.min(Math.max(0, startLevel), MAZE_LEVELS.length - 1)
    const [mazeSeed, setMazeSeed] = useState(20260527)
    const [levelIndex, setLevelIndex] = useState(safeStartLevel)
    const [bestLevel, setBestLevel] = useState(safeStartLevel)
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
    { id: 'number', emoji: '🔢', title: 'Toán Học', desc: 'Nhiều màn với ô đáp án' },
    { id: 'memory', emoji: '🧠', title: 'Tư Duy', desc: 'Lật thẻ ghi nhớ' },
    { id: 'music', emoji: '🎵', title: 'Âm Nhạc', desc: 'Nhắc lại giai điệu' },
    { id: 'maze', emoji: '🧭', title: 'Kỹ Năng Sống', desc: 'Mê cung phiêu lưu' },
    { id: 'color', emoji: '🎨', title: 'Mỹ Thuật', desc: 'Pha màu kỳ diệu' },
]

interface GameMapNode {
    slug: string
    label: string
    imageUrl: string
    gameId: GameId
    top: string
    left: string
    subs: Array<{ slug: string; label: string; imageUrl: string }>
}

const GAME_MAP_NODES: GameMapNode[] = [
    {
        slug: 'tu-duy',
        label: 'Tư Duy',
        imageUrl: 'https://assets.cuthongminh.com/games/home/tu_duy.webp',
        gameId: 'memory',
        top: '30%',
        left: '17%',
        subs: [
            { slug: 'find-pattern', label: 'Quy Luật', imageUrl: 'https://assets.cuthongminh.com/games/find-pattern/logo.webp' },
            { slug: 'mini-sudoku-kids', label: 'Sudoku', imageUrl: 'https://assets.cuthongminh.com/games/mini-sudoku-kids/logo.webp' },
            { slug: 'find-differences', label: 'Điểm khác biệt', imageUrl: 'https://assets.cuthongminh.com/games/game-4-logo.webp' },
            { slug: 'line-connect', label: 'Nối Điểm Trí Tuệ', imageUrl: 'https://assets.cuthongminh.com/games/line-connect/logo.webp' },
            { slug: 'odd-one-out', label: 'Hình khác biệt', imageUrl: 'https://assets.cuthongminh.com/games/odd-one-out/logo.webp' },
            { slug: 'maze-runner', label: 'Mê Cung', imageUrl: 'https://assets.cuthongminh.com/games/maze-runner/logo.webp' },
        ],
    },
    {
        slug: 'my-thuat',
        label: 'Mỹ Thuật',
        imageUrl: 'https://assets.cuthongminh.com/games/home/ve.webp',
        gameId: 'color',
        top: '30%',
        left: '41%',
        subs: [
            { slug: 'learn-color', label: 'Học Màu Sắc', imageUrl: 'https://assets.cuthongminh.com/games/learn-color-color.webp' },
            { slug: 'mix-color', label: 'Pha Màu', imageUrl: 'https://assets.cuthongminh.com/games/learn-color-color.webp' },
            { slug: 'paint-picture', label: 'Tô Màu', imageUrl: 'https://assets.cuthongminh.com/games/paint-picture/logo.webp' },
        ],
    },
    {
        slug: 'ky-nang-song',
        label: 'Kỹ Năng Sống',
        imageUrl: 'https://assets.cuthongminh.com/games/home/ky_nang_song.webp',
        gameId: 'maze',
        top: '30%',
        left: '64%',
        subs: [
            { slug: 'learn-vehicle', label: 'Phương tiện', imageUrl: 'https://assets.cuthongminh.com/games/learn-vehicle/logo.webp' },
            { slug: 'learn-occupation', label: 'Nghề nghiệp', imageUrl: 'https://assets.cuthongminh.com/games/learn-occupation/logo.webp' },
            { slug: 'learn-hygiene', label: 'Vệ sinh cá nhân', imageUrl: 'https://assets.cuthongminh.com/games/learn-hygiene/logo.webp' },
            { slug: 'learn-traffic', label: 'An Toàn Giao Thông', imageUrl: 'https://assets.cuthongminh.com/games/learn-traffic/logo.webp' },
            { slug: 'learn-emotion', label: 'Cảm Xúc', imageUrl: 'https://assets.cuthongminh.com/games/learn-emotion/logo.webp' },
            { slug: 'learn-clock', label: 'Xem Đồng Hồ', imageUrl: 'https://assets.cuthongminh.com/games/learn-clock/logo-main.webp' },
        ],
    },
    {
        slug: 'dia-ly-tu-nhien',
        label: 'Địa Lý Tự Nhiên',
        imageUrl: 'https://assets.cuthongminh.com/games/home/dia_ly.webp',
        gameId: 'maze',
        top: '30%',
        left: '86%',
        subs: [
            { slug: 'learn-flag', label: 'Cờ quốc gia', imageUrl: 'https://assets.cuthongminh.com/games/learn-flag/logo.webp' },
            { slug: 'learn-landmark', label: 'Địa Danh Nổi Tiếng', imageUrl: 'https://assets.cuthongminh.com/games/learn-landmark/logo.webp' },
            { slug: 'learn-costume', label: 'Trang Phục Thế Giới', imageUrl: 'https://assets.cuthongminh.com/games/learn-costume/logo.webp' },
            { slug: 'learn-terrain', label: 'Địa Hình', imageUrl: 'https://assets.cuthongminh.com/games/learn-terrain/logo.webp' },
        ],
    },
    {
        slug: 'am-nhac',
        label: 'Âm Nhạc',
        imageUrl: 'https://assets.cuthongminh.com/games/home/am_nhac.webp',
        gameId: 'music',
        top: '58%',
        left: '18%',
        subs: [
            { slug: 'learn-instrument', label: 'Nhạc cụ', imageUrl: 'https://assets.cuthongminh.com/games/learn-instrument/logo.webp' },
            { slug: 'mini-piano', label: 'Đàn Piano Tí Hon', imageUrl: 'https://assets.cuthongminh.com/games/mini-piano/logo.webp' },
            { slug: 'learn-notes', label: 'Học Nốt Nhạc', imageUrl: 'https://assets.cuthongminh.com/games/learn-notes/logo.webp' },
        ],
    },
    {
        slug: 'khoa-hoc',
        label: 'Khoa Học',
        imageUrl: 'https://assets.cuthongminh.com/games/home/khoa_hoc.webp',
        gameId: 'memory',
        top: '58%',
        left: '41%',
        subs: [
            { slug: 'learn-animal', label: 'Động vật', imageUrl: 'https://assets.cuthongminh.com/games/learn-animal/logo.webp' },
            { slug: 'learn-fruit', label: 'Trái cây', imageUrl: 'https://assets.cuthongminh.com/games/learn-fruit/logo.webp' },
            { slug: 'learn-food', label: 'Món ăn', imageUrl: 'https://assets.cuthongminh.com/games/learn-food/logo.webp' },
            { slug: 'learn-dinosaur', label: 'Khủng long', imageUrl: 'https://assets.cuthongminh.com/games/learn-dinosaur/logo.webp' },
            { slug: 'learn-flower', label: 'Hoa & Cây', imageUrl: 'https://assets.cuthongminh.com/games/learn-flower/logo.webp' },
            { slug: 'learn-weather', label: 'Thời tiết', imageUrl: 'https://assets.cuthongminh.com/games/learn-weather/logo.webp' },
        ],
    },
    {
        slug: 'ngon-ngu',
        label: 'Ngôn Ngữ',
        imageUrl: 'https://assets.cuthongminh.com/games/home/ngon_ngu.webp',
        gameId: 'memory',
        top: '58%',
        left: '64%',
        subs: [
            { slug: 'learn-word', label: 'Học Từ Vựng', imageUrl: 'https://assets.cuthongminh.com/games/learn-word/logo.webp' },
            { slug: 'learn-tones', label: 'Học Dấu Tiếng Việt', imageUrl: 'https://assets.cuthongminh.com/games/learn-tones/logo.webp' },
            { slug: 'learn-alphabet', label: 'Bảng chữ cái', imageUrl: 'https://assets.cuthongminh.com/games/learn-alphabet/logo.webp' },
            { slug: 'learn-syllable', label: 'Ghép Vần', imageUrl: 'https://assets.cuthongminh.com/games/learn-syllable/logo.webp' },
        ],
    },
    {
        slug: 'toan-hoc',
        label: 'Toán Học',
        imageUrl: 'https://assets.cuthongminh.com/games/home/toan.webp',
        gameId: 'number',
        top: '58%',
        left: '86%',
        subs: [
            { slug: 'learn-numbers', label: 'Đếm số', imageUrl: 'https://assets.cuthongminh.com/games/learn-numbers/number-logo.webp' },
            { slug: 'compare-quantity', label: 'So sánh', imageUrl: 'https://assets.cuthongminh.com/games/game-3-logo.webp' },
            { slug: 'learn-shape', label: 'Hình dạng', imageUrl: 'https://assets.cuthongminh.com/games/learn-shape/learn-shape-logo.webp' },
            { slug: 'learn-math', label: 'Toán đơn giản', imageUrl: 'https://assets.cuthongminh.com/games/learn-math/logo.webp' },
            { slug: 'learn-multiply', label: 'Phép Nhân', imageUrl: 'https://assets.cuthongminh.com/games/learn-multiply/logo.webp' },
            { slug: 'learn-divide', label: 'Phép Chia', imageUrl: 'https://assets.cuthongminh.com/games/learn-divide/logo.webp' },
        ],
    },
    {
        slug: 'tieng-anh',
        label: 'Tiếng Anh',
        imageUrl: 'https://assets.cuthongminh.com/games/learn-english-vocab/tieng_anh.webp',
        gameId: 'music',
        top: '83%',
        left: '52%',
        subs: [
            { slug: 'learn-english-vocab', label: 'Học Từ Vựng', imageUrl: 'https://assets.cuthongminh.com/games/learn-english-vocab/logo.webp' },
            { slug: 'learn-english-alphabet', label: 'Bảng Chữ Cái', imageUrl: 'https://assets.cuthongminh.com/games/learn-english-alphabet/logo.webp' },
        ],
    },
]

function getSubNodePosition(total: number, index: number) {
    if (total <= 1) return { x: 0, y: 0 }
    if (total === 2) {
        return index === 0 ? { x: -124, y: 0 } : { x: 124, y: 0 }
    }

    const radiusByCount: Record<number, number> = {
        3: 140,
        4: 146,
        5: 154,
        6: 162,
    }
    const radius = radiusByCount[total] ?? 150
    const angle = ((-90 + (index * 360) / total) * Math.PI) / 180
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }
}

export default function ChildGamesPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = useMemo(() => createClient(), [])
    const audio = useAudioControls()
    const [stars, setStars] = useState(0)
    const [currentStreak, setCurrentStreak] = useState(0)
    const [bestStreak, setBestStreak] = useState(0)
    const [childId, setChildId] = useState<string | null>(null)
    const [expandedNodeSlug, setExpandedNodeSlug] = useState<string | null>(null)
    const viewParam = searchParams.get('view')
    const embedMode = searchParams.get('embed') === '1'
    const returnTo = searchParams.get('returnTo')
    const autoReturn = searchParams.get('autoReturn') === '1'
    const randomLevel = searchParams.get('randomLevel') === '1'
    const [randomSeed] = useState(() => Number(searchParams.get('seed')) || Date.now())
    const randomConfig = useMemo(() => {
        const rand = createSeededRandom(randomSeed)
        return {
            gameId: GAME_TABS[Math.floor(rand() * GAME_TABS.length)].id,
            numberLevel: Math.floor(rand() * MATH_LEVELS.length),
            memoryLevel: Math.floor(rand() * MEMORY_LEVELS.length),
            mazeLevel: Math.floor(rand() * MAZE_LEVELS.length),
            musicLevel: Math.max(1, Math.floor(rand() * 4) + 1),
        }
    }, [randomSeed])

    const isRandom = viewParam === 'random'
    const standaloneView = !isRandom && viewParam ? (viewParam as GameId) : null
    const isStandalone = standaloneView !== null || isRandom

    useEffect(() => {
        if (!embedMode || typeof document === 'undefined') return

        document.documentElement.style.colorScheme = 'light'
        document.documentElement.style.background = '#ffffff'
        document.body.style.background = '#ffffff'

        const styleId = 'mindory-hide-next-indicator'
        let styleEl = document.getElementById(styleId) as HTMLStyleElement | null
        if (!styleEl) {
            styleEl = document.createElement('style')
            styleEl.id = styleId
            styleEl.textContent = 'nextjs-portal{display:none!important;}'
            document.head.appendChild(styleEl)
        }

        return () => {
            document.documentElement.style.colorScheme = ''
            document.documentElement.style.background = ''
            document.body.style.background = ''
        }
    }, [embedMode])

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

    const hasReturnedRef = useRef(false)
    const reportPlay = useCallback(async (payload: PlayReportPayload) => {
        if (!childId) {
            addLocalStars(payload.starsEarned)
        } else {
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
        }

        if (embedMode && typeof window !== 'undefined' && window.parent) {
            window.parent.postMessage({ type: 'mindory:game-complete' }, '*')
        }

        if (autoReturn && returnTo && !hasReturnedRef.current) {
            hasReturnedRef.current = true
            window.setTimeout(() => {
                router.push(returnTo)
            }, 600)
        }
    }, [addLocalStars, autoReturn, childId, embedMode, returnTo, router])

    const effectiveGame = isRandom ? randomConfig.gameId : standaloneView ?? 'number'

    const activeGameContent = useMemo(() => {
        const useRandom = isRandom || randomLevel
        const numberStart = useRandom ? randomConfig.numberLevel : 0
        const memoryStart = useRandom ? randomConfig.memoryLevel : 0
        const mazeStart = useRandom ? randomConfig.mazeLevel : 0
        const musicStart = useRandom ? randomConfig.musicLevel : 1

        if (effectiveGame === 'number') return <NumberChaseGame onReportPlay={reportPlay} audio={audio} startLevel={numberStart} />
        if (effectiveGame === 'memory') return <MemoryFlipGame onReportPlay={reportPlay} audio={audio} startLevel={memoryStart} />
        if (effectiveGame === 'maze') return <MazeRunnerGame onReportPlay={reportPlay} audio={audio} startLevel={mazeStart} />
        if (effectiveGame === 'color') return <ColorMixGame onReportPlay={reportPlay} audio={audio} />
        return <MusicPatternGame onReportPlay={reportPlay} audio={audio} startLevel={musicStart} />
    }, [audio, effectiveGame, isRandom, randomConfig, randomLevel, reportPlay])

    const selectedMeta = useMemo(() => {
        return GAME_TABS.find((item) => item.id === effectiveGame) ?? GAME_TABS[0]
    }, [effectiveGame])

    if (embedMode) {
        return (
            <div className="h-full w-full overflow-hidden bg-white">
                <div key={effectiveGame} className="ctm-fade-up">
                    {activeGameContent}
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#aed7df] py-3 px-1 sm:px-3">
            <div className="mx-auto max-w-[1400px] space-y-5">
                <section className="rounded-[2rem] border-4 border-white/80 bg-[#ece5d5] px-5 py-3 shadow-[0_8px_0_rgba(255,255,255,0.45)]">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <Image src="https://assets.cuthongminh.com/assets/logo-long.webp" alt="Cú Thông Minh" width={260} height={56} className="h-12 w-auto sm:h-14" />
                        </div>
                        <div className="flex items-center gap-2 rounded-full border-2 border-sky-200 bg-white px-3 py-1.5">
                            <Image src="https://assets.cuthongminh.com/assets/avatar-boy.webp" alt="Avatar" width={56} height={56} className="h-12 w-12 rounded-full border-2 border-sky-100" />
                            <div className="pr-2">
                                <p className="text-sm font-black text-slate-700">hi</p>
                                <p className="text-sm font-black text-blue-500">Cấp độ 1</p>
                                <p className="text-[11px] font-bold text-slate-500">⭐ {stars} • 🔥 {currentStreak} • 🏅 {bestStreak}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {!isStandalone ? (
                <section className="mx-auto w-full max-w-[1400px] rounded-[2rem] border-4 border-white/70 bg-[#b7dbe4] p-2 shadow-xl">
                    <div
                        className="relative h-[690px] overflow-hidden rounded-[1.6rem] border-2 border-white/70"
                        onClick={() => setExpandedNodeSlug(null)}
                    >
                        <Image src="https://assets.cuthongminh.com/assets/bg-games-home.webp" alt="Bản đồ trò chơi" fill className="object-cover" />
                        {GAME_MAP_NODES.map((node) => {
                            const isExpanded = node.slug === expandedNodeSlug
                            const hasExpandedNode = expandedNodeSlug !== null
                            const isBlockedLargeNode = hasExpandedNode && !isExpanded
                            const top = isExpanded ? '50%' : node.top
                            const left = isExpanded ? '50%' : node.left
                            return (
                                <div
                                    key={node.slug}
                                    className={cn(
                                        'absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out',
                                        isExpanded && 'z-30 scale-100',
                                        !isExpanded && hasExpandedNode && 'z-10 opacity-35 grayscale-[45%] scale-95',
                                        !isExpanded && !hasExpandedNode && 'z-20 opacity-100 grayscale-0 scale-100'
                                    )}
                                    style={{ top, left }}
                                >
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation()
                                            if (isBlockedLargeNode) return
                                            if (isExpanded) {
                                                setExpandedNodeSlug(null)
                                                return
                                            }
                                            setExpandedNodeSlug(node.slug)
                                        }}
                                        className={cn(
                                            'relative transition-transform',
                                            !isBlockedLargeNode && 'hover:scale-105',
                                            isBlockedLargeNode && 'cursor-default'
                                        )}
                                    >
                                        <div className={cn(
                                            'relative h-28 w-28 rounded-full border-[5px] border-orange-500 bg-white shadow-xl transition-all duration-300 sm:h-36 sm:w-36',
                                            isExpanded && 'scale-110 ring-4 ring-orange-300 ring-offset-2'
                                        )}>
                                            <Image src={node.imageUrl} alt={node.label} fill className="rounded-full object-contain p-2" />
                                        </div>
                                    </button>

                                    <div className={cn('pointer-events-none absolute inset-0 m-auto h-full w-full transition-opacity duration-500 ease-out', isExpanded ? 'opacity-100' : 'opacity-0')}>
                                        {node.subs.map((sub, index) => {
                                            const total = node.subs.length
                                            const { x, y } = getSubNodePosition(total, index)
                                            return (
                                                <div
                                                    key={sub.slug}
                                                    className="absolute inset-0 m-auto h-16 w-16 transition-all duration-500 ease-out sm:h-20 sm:w-20"
                                                    style={{
                                                        transform: `translate(${x}px, ${y}px) scale(${isExpanded ? 1 : 0.2})`,
                                                        opacity: isExpanded ? 1 : 0,
                                                        pointerEvents: isExpanded ? 'auto' : 'none',
                                                        transitionDelay: `${isExpanded ? index * 60 : 0}ms`,
                                                    }}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation()
                                                            router.push(`/child/games/${sub.slug}`)
                                                        }}
                                                        className="group/game block h-full w-full"
                                                    >
                                                        <div className="relative flex h-full w-full items-center justify-center rounded-full border-2 border-orange-300 bg-white shadow-xl transition-transform hover:scale-110">
                                                            <Image src={sub.imageUrl} alt={sub.label} fill className="object-contain p-1 drop-shadow-sm" />
                                                        </div>
                                                        <div className="pointer-events-none absolute -bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-blue-600/80 px-3 py-1 text-xs font-bold text-white shadow-md transition-opacity">
                                                            {sub.label}
                                                        </div>
                                                    </button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>
                ) : null}

                {isStandalone ? (
                <section className="rounded-[1.6rem] border-2 border-white/80 bg-white/90 p-4 shadow-xl">
                    {isStandalone ? (
                        <div className="mb-3">
                            <button
                                type="button"
                                onClick={() => router.push('/child/games')}
                                className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-700 hover:bg-sky-200"
                            >
                                ← Quay lại bản đồ trò chơi
                            </button>
                        </div>
                    ) : null}
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-700">
                            {selectedMeta.emoji} {selectedMeta.title}
                        </span>
                        <span className="text-xs font-bold text-slate-500">{selectedMeta.desc}</span>
                    </div>
                    <div key={effectiveGame} className="ctm-fade-up">
                        {activeGameContent}
                    </div>
                </section>
                ) : null}
            </div>
        </div>
    )
}
