export interface RainbowPianoKey {
    id: string
    displayLabel: string
    speakLabel: string
    freq: number
    colorClass: string
}

export interface MiniMusicianSong {
    slug: string
    title: string
    notes: string[]
}

export const RAINBOW_PIANO_KEYS: RainbowPianoKey[] = [
    { id: 'do-low', displayLabel: 'Đồ', speakLabel: 'Đô', freq: 261.63, colorClass: 'bg-red-500' },
    { id: 're', displayLabel: 'Rê', speakLabel: 'Rê', freq: 293.66, colorClass: 'bg-orange-500' },
    { id: 'mi', displayLabel: 'Mi', speakLabel: 'Mi', freq: 329.63, colorClass: 'bg-yellow-500' },
    { id: 'fa', displayLabel: 'Fa', speakLabel: 'Fa', freq: 349.23, colorClass: 'bg-green-500' },
    { id: 'sol', displayLabel: 'Sol', speakLabel: 'Sol', freq: 392, colorClass: 'bg-blue-500' },
    { id: 'la', displayLabel: 'La', speakLabel: 'La', freq: 440, colorClass: 'bg-indigo-500' },
    { id: 'si', displayLabel: 'Si', speakLabel: 'Si', freq: 493.88, colorClass: 'bg-purple-500' },
    { id: 'do-high', displayLabel: 'Đố', speakLabel: 'Đố', freq: 523.25, colorClass: 'bg-pink-500' },
]

export const MINI_MUSICIAN_SONGS: MiniMusicianSong[] = [
    {
        slug: 'kia-con-buom-vang',
        title: 'Kìa con bướm vàng',
        notes: [
            'mi', 'fa', 'sol', 'mi',
            'mi', 'fa', 'sol', 'mi',
            'sol', 'la', 'sol', 'fa', 'mi',
            're', 'mi', 'fa', 're',
            'mi', 're', 'do-low',
        ],
    },
    {
        slug: 'happy-birthday',
        title: 'Chúc mừng sinh nhật',
        notes: [
            'do-low', 'do-low', 're', 'do-low', 'fa', 'mi',
            'do-low', 'do-low', 're', 'do-low', 'sol', 'fa',
            'do-low', 'do-low', 'do-high', 'la', 'fa', 'mi', 're',
            'la', 'la', 'la', 'fa', 'sol', 'fa',
        ],
    },
    {
        slug: 'ngoi-sao-lap-lanh',
        title: 'Ngôi sao lấp lánh',
        notes: [
            'do-low', 'do-low', 'sol', 'sol', 'la', 'la', 'sol',
            'fa', 'fa', 'mi', 'mi', 're', 're', 'do-low',
            'sol', 'sol', 'fa', 'fa', 'mi', 'mi', 're', // dien khuc 1
            'sol', 'sol', 'fa', 'fa', 'mi', 'mi', 're', // dien khuc 2
            'do-low', 'do-low', 'sol', 'sol', 'la', 'la', 'sol',
            'fa', 'fa', 'mi', 'mi', 're', 're', 'do-low',
        ],
    },
    {
        slug: 'ba-oi-ba',
        title: 'Bà ơi bà',
        notes: [
            'sol', 'la', 'sol', 'mi', 'sol', 'la', 'sol', 're',
            'mi', 'fa', 'mi', 're', 'do-low', 're', 'mi', 'sol',
            'sol', 'la', 'sol', 'mi', 'sol', 'la', 'sol', 're',
            'mi', 'fa', 'sol', 'la', 'sol', 'fa', 'mi', 're', 'do-low',
            'do-low', 're', 'mi', 'sol', 'la', 'sol', 'mi', 're', 'do-low',
        ],
    },
    {
        slug: 'em-yeu-truong-em',
        title: 'Em yêu trường em',
        notes: [
            'do-low', 're', 'mi', 'fa', 'sol', 'sol', 'la', 'sol',
            'fa', 'mi', 're', 'mi', 'fa', 'sol', 'mi', 're',
            'do-low', 're', 'mi', 'fa', 'sol', 'la', 'sol', 'fa',
            'mi', 're', 'do-low', 're', 'mi', 'fa', 'mi', 're', 'do-low',
            'sol', 'la', 'sol', 'fa', 'mi', 're', 'do-low',
        ],
    },
]

export function findRainbowKeyById(id: string) {
    return RAINBOW_PIANO_KEYS.find((key) => key.id === id) ?? null
}
