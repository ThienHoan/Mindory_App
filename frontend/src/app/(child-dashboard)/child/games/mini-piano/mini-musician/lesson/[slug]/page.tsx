'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { findRainbowKeyById, MINI_MUSICIAN_SONGS, RAINBOW_PIANO_KEYS } from '../../../data'

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function getPreferredVoice(voices: SpeechSynthesisVoice[]) {
    return (
        voices.find((voice) => /google/i.test(voice.name) && /vi/i.test(voice.lang)) ??
        voices.find((voice) => /vi/i.test(voice.lang)) ??
        voices.find((voice) => /google/i.test(voice.name))
    )
}

function useCoachVoice() {
    const voiceListRef = useRef<SpeechSynthesisVoice[]>([])

    const speak = useCallback((text: string) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

        const synth = window.speechSynthesis
        if (voiceListRef.current.length === 0) {
            voiceListRef.current = synth.getVoices()
        }

        const utter = new SpeechSynthesisUtterance(text)
        utter.lang = 'vi-VN'
        utter.rate = 0.92
        utter.pitch = 1.05
        const preferred = getPreferredVoice(voiceListRef.current)
        if (preferred) utter.voice = preferred

        synth.cancel()
        synth.speak(utter)
    }, [])

    return { speak }
}

function usePianoAudio() {
    const audioRef = useRef<AudioContext | null>(null)

    const ensureContext = useCallback(async () => {
        if (typeof window === 'undefined') return null
        if (!audioRef.current || audioRef.current.state === 'closed') {
            audioRef.current = new window.AudioContext()
        }
        if (audioRef.current.state === 'suspended') {
            await audioRef.current.resume()
        }
        return audioRef.current
    }, [])

    const playFrequency = useCallback(async (freq: number, duration = 0.42, gainValue = 0.17) => {
        const ctx = await ensureContext()
        if (!ctx) return

        const oscMain = ctx.createOscillator()
        const oscHarm = ctx.createOscillator()
        const gain = ctx.createGain()

        oscMain.type = 'sine'
        oscMain.frequency.value = freq
        oscHarm.type = 'triangle'
        oscHarm.frequency.value = freq * 2

        gain.gain.setValueAtTime(0.0001, ctx.currentTime)
        gain.gain.linearRampToValueAtTime(gainValue, ctx.currentTime + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)

        oscMain.connect(gain)
        oscHarm.connect(gain)
        gain.connect(ctx.destination)

        oscMain.start()
        oscHarm.start()
        oscMain.stop(ctx.currentTime + duration)
        oscHarm.stop(ctx.currentTime + duration)
    }, [ensureContext])

    const playError = useCallback(async () => {
        const ctx = await ensureContext()
        if (!ctx) return

        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sawtooth'
        osc.frequency.value = 195
        gain.gain.setValueAtTime(0.13, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.2)
    }, [ensureContext])

    return { playFrequency, playError }
}

export default function MiniMusicianLessonPage() {
    const params = useParams<{ slug: string }>()
    const slug = params?.slug
    const { playFrequency, playError } = usePianoAudio()
    const { speak } = useCoachVoice()

    const song = useMemo(() => MINI_MUSICIAN_SONGS.find((item) => item.slug === slug) ?? null, [slug])

    const [activeKeyId, setActiveKeyId] = useState<string | null>(null)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [message, setMessage] = useState('Bé bấm theo đúng nốt đang sáng nhé!')
    const [playingGuide, setPlayingGuide] = useState(false)
    const [guideIndex, setGuideIndex] = useState(-1)
    const [wrongFlashKeyId, setWrongFlashKeyId] = useState<string | null>(null)

    const isCompleted = !!song && currentIndex >= song.notes.length
    const nextSong = useMemo(() => {
        if (!song) return null
        const idx = MINI_MUSICIAN_SONGS.findIndex((item) => item.slug === song.slug)
        if (idx < 0 || idx >= MINI_MUSICIAN_SONGS.length - 1) return null
        return MINI_MUSICIAN_SONGS[idx + 1]
    }, [song])

    const expectedNote = song && !isCompleted ? song.notes[currentIndex] : null

    useEffect(() => {
        if (!song) return
        speak(`Bài hát ${song.title}`)
    }, [song, speak])

    const pressKey = useCallback(async (keyId: string) => {
        if (!song || playingGuide) return

        const key = findRainbowKeyById(keyId)
        if (!key) return

        setActiveKeyId(key.id)
        await playFrequency(key.freq, 0.46, 0.22)
        window.setTimeout(() => setActiveKeyId((current) => (current === key.id ? null : current)), 170)

        if (isCompleted) return

        const expected = song.notes[currentIndex]
        if (key.id === expected) {
            const next = currentIndex + 1
            setCurrentIndex(next)
            if (next >= song.notes.length) {
                setMessage('Tuyệt vời! Bé đã hoàn thành bài hát này rồi!')
            } else {
                setMessage('Đúng rồi! Mình bấm nốt tiếp theo nhé!')
            }
            return
        }

        setWrongFlashKeyId(key.id)
        window.setTimeout(() => setWrongFlashKeyId((current) => (current === key.id ? null : current)), 300)
        await playError()
        setMessage('Chưa đúng nốt. Bé thử lại theo vòng tròn đang sáng nhé!')
    }, [currentIndex, isCompleted, playError, playFrequency, playingGuide, song])

    const playGuide = useCallback(async () => {
        if (!song) return
        setPlayingGuide(true)
        setGuideIndex(-1)
        setMessage('Đang phát mẫu bài hát...')

        for (let idx = 0; idx < song.notes.length; idx += 1) {
            const noteId = song.notes[idx]
            const note = findRainbowKeyById(noteId)
            if (!note) continue
            setGuideIndex(idx)
            setActiveKeyId(note.id)
            await playFrequency(note.freq, 0.36, 0.16)
            await sleep(330)
        }

        setActiveKeyId(null)
        setGuideIndex(-1)
        setPlayingGuide(false)
        setMessage('Bé bấm theo đúng nốt đang sáng nhé!')
    }, [playFrequency, song])

    if (!song) {
        return (
            <div className="relative flex min-h-screen flex-col overflow-hidden px-4 py-6">
                <Image
                    src="https://assets.cuthongminh.com/assets/bg.webp"
                    alt="Background"
                    fill
                    sizes="100vw"
                    className="object-cover z-0"
                />
                <main className="relative z-10 mx-auto w-full max-w-4xl">
                    <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
                        <p className="text-lg font-black text-slate-700">Không tìm thấy bài hát.</p>
                        <Link href="/child/games/mini-piano/mini-musician" className="mt-4 inline-flex rounded-full bg-sky-100 px-4 py-2 text-xs font-black text-sky-700">
                            ← Quay lại danh sách bài
                        </Link>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="relative flex min-h-screen flex-col overflow-hidden px-4 py-6">
            <Image
                src="https://assets.cuthongminh.com/assets/bg.webp"
                alt="Background"
                fill
                sizes="100vw"
                className="object-cover z-0"
            />

            <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center pt-4 text-center">
                <div className="mb-4 flex w-full justify-start sm:mb-8">
                    <Link
                        href="/child/games/mini-piano/mini-musician"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-orange-400 to-orange-600 px-3 py-1.5 text-sm font-extrabold text-white shadow-[0_6px_0_#b45309] transition-all duration-150 hover:-translate-y-0.5 hover:brightness-105 active:translate-y-1 active:brightness-95 sm:gap-2 sm:px-4 sm:py-2 sm:text-base"
                    >
                        <ArrowLeft className="h-[18px] w-[18px] text-white" />
                        <span>Quay lại</span>
                    </Link>
                </div>

                <div className="flex w-full flex-col items-center">
                    <div className="w-full">
                    <div className="mb-4 rounded-2xl border border-white bg-white/60 p-4 text-center shadow-xl backdrop-blur-md sm:mb-8 sm:p-6">
                        <h2 className="mb-1 text-2xl font-bold text-purple-700 sm:mb-2 sm:text-3xl">{song.title}</h2>
                        <div className="mt-2 flex flex-wrap justify-center gap-1.5 sm:mt-4 sm:gap-2">
                            {song.notes.map((noteId, index) => {
                                const note = findRainbowKeyById(noteId)
                                if (!note) return null
                                const isGuideCurrent = playingGuide && index === guideIndex
                                const isCurrent = !playingGuide && index === currentIndex && !isCompleted
                                const isDone = index < currentIndex

                                return (
                                    <div
                                        key={`${song.slug}-${index}`}
                                        className={cn(
                                            'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white transition-all sm:h-10 sm:w-10 sm:text-base',
                                            isGuideCurrent && 'scale-110 bg-sky-500 ring-4 ring-sky-200 animate-pulse',
                                            isCurrent && 'scale-110 bg-purple-600 ring-4 ring-purple-200',
                                            isDone && 'scale-90 bg-green-500',
                                            !isGuideCurrent && !isCurrent && !isDone && 'bg-gray-300'
                                        )}
                                    >
                                        {note.displayLabel}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="rounded-[1.5rem] border-t-[6px] border-[#333] bg-[#4a4a4a] p-2 shadow-2xl sm:rounded-[2rem] sm:border-t-[10px] sm:p-8">
                        <div className="flex justify-center gap-0.5 sm:gap-2">
                            {RAINBOW_PIANO_KEYS.map((key) => {
                                const isTarget = expectedNote === key.id
                                const isPressed = activeKeyId === key.id
                                const isWrong = wrongFlashKeyId === key.id

                                return (
                                    <button
                                        key={key.id}
                                        type="button"
                                        disabled={playingGuide}
                                        onClick={() => pressKey(key.id)}
                                        className={cn(
                                            'relative flex h-[220px] min-w-0 flex-1 flex-col items-center justify-end rounded-b-2xl pb-4 shadow-[inset_0_-8px_10px_rgba(0,0,0,0.1),0_10px_15px_rgba(0,0,0,0.1)] transition-all duration-100 hover:brightness-105 [@media(min-width:376px)]:h-[280px] sm:h-[350px] sm:pb-8',
                                            key.colorClass,
                                            isTarget && 'z-10 scale-105 animate-pulse ring-8 ring-inset ring-white',
                                            isPressed && '-translate-y-1 brightness-110 ring-4 ring-white/70',
                                            isWrong && 'ring-4 ring-red-400',
                                            playingGuide && 'cursor-not-allowed opacity-95'
                                        )}
                                    >
                                        <div className="z-20 mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/30 backdrop-blur-sm shadow-sm [@media(min-width:376px)]:h-12 [@media(min-width:376px)]:w-12 sm:mb-4 sm:h-16 sm:w-16">
                                            <span className="select-none text-lg font-black leading-none text-white drop-shadow-md [@media(min-width:376px)]:text-xl sm:text-2xl">
                                                {key.displayLabel}
                                            </span>
                                        </div>
                                        <div className="absolute left-0 top-0 h-8 w-full rounded-t-sm bg-black/10" />
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                    </div>
                </div>

                <div className="mt-6 flex w-full max-w-3xl flex-col items-center gap-3">
                    <p className="text-sm font-bold text-slate-600">{message}</p>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <button
                            type="button"
                            onClick={playGuide}
                            disabled={playingGuide}
                            className="rounded-full bg-purple-600 px-5 py-2 text-sm font-black text-white hover:bg-purple-700 disabled:opacity-60"
                        >
                            {playingGuide ? 'Đang phát mẫu...' : 'Nghe mẫu bài hát'}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setCurrentIndex(0)
                                setMessage('Bé bấm theo đúng nốt đang sáng nhé!')
                                setWrongFlashKeyId(null)
                            }}
                            className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
                        >
                            Chơi lại
                        </button>

                        {isCompleted && nextSong ? (
                            <Link
                                href={`/child/games/mini-piano/mini-musician/lesson/${nextSong.slug}`}
                                className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-black text-white hover:bg-emerald-600"
                            >
                                Bài tiếp theo
                            </Link>
                        ) : null}
                    </div>
                </div>
            </main>
        </div>
    )
}
