import { redirect } from 'next/navigation'

export default function MazeRunnerPage() {
    redirect('/child/games?view=maze')
}
