import { notFound, redirect } from 'next/navigation'

type GameView = 'number' | 'memory' | 'music' | 'maze' | 'color'

const GAME_VIEW_BY_SLUG: Record<string, GameView> = {
    'tu-duy': 'memory',
    'my-thuat': 'color',
    'ky-nang-song': 'maze',
    'dia-ly-tu-nhien': 'maze',
    'am-nhac': 'music',
    'khoa-hoc': 'memory',
    'ngon-ngu': 'memory',
    'toan-hoc': 'number',
    'tieng-anh': 'music',
    'maze-runner': 'maze',
    'find-pattern': 'memory',
    'find-differences': 'memory',
    'odd-one-out': 'memory',
    'line-connect': 'maze',
    'mini-sudoku-kids': 'memory',
    'learn-color': 'color',
    'mix-color': 'color',
    'paint-picture': 'color',
    'learn-vehicle': 'maze',
    'learn-occupation': 'maze',
    'learn-hygiene': 'maze',
    'learn-traffic': 'maze',
    'learn-emotion': 'memory',
    'learn-clock': 'number',
    'learn-flag': 'memory',
    'learn-landmark': 'memory',
    'learn-costume': 'memory',
    'learn-terrain': 'maze',
    'learn-instrument': 'music',
    'mini-piano': 'music',
    'learn-notes': 'music',
    'learn-animal': 'memory',
    'learn-fruit': 'memory',
    'learn-food': 'memory',
    'learn-dinosaur': 'memory',
    'learn-flower': 'memory',
    'learn-weather': 'memory',
    'learn-word': 'memory',
    'learn-tones': 'memory',
    'learn-alphabet': 'memory',
    'learn-syllable': 'memory',
    'learn-numbers': 'number',
    'compare-quantity': 'number',
    'learn-shape': 'number',
    'learn-math': 'number',
    'learn-multiply': 'number',
    'learn-divide': 'number',
    'learn-english-vocab': 'music',
    'learn-english-alphabet': 'music',
}

export default async function GameSlugPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const view = GAME_VIEW_BY_SLUG[slug]
    if (!view) {
        notFound()
    }
    redirect(`/child/games?view=${view}`)
}
