import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

interface MiniGameRow {
    child_id: string;
    game_id: string;
    score: number;
    accuracy: number;
    duration_seconds: number;
    stars_earned: number;
    played_at: string;
}

function toUtcDateKey(input: string) {
    return new Date(input).toISOString().slice(0, 10);
}

function calcStreaksByDates(dates: string[]) {
    if (dates.length === 0) return { currentStreak: 0, bestStreak: 0 };

    const uniqueSorted = Array.from(new Set(dates)).sort((a, b) => (a < b ? 1 : -1));
    const today = new Date().toISOString().slice(0, 10);

    let currentStreak = 0;
    if (uniqueSorted[0] === today) {
        currentStreak = 1;
        for (let i = 1; i < uniqueSorted.length; i += 1) {
            const prev = new Date(`${uniqueSorted[i - 1]}T00:00:00.000Z`);
            const cur = new Date(`${uniqueSorted[i]}T00:00:00.000Z`);
            const diffDays = Math.round((prev.getTime() - cur.getTime()) / 86400000);
            if (diffDays === 1) currentStreak += 1;
            else break;
        }
    }

    let bestStreak = 1;
    let rolling = 1;
    for (let i = 1; i < uniqueSorted.length; i += 1) {
        const prev = new Date(`${uniqueSorted[i - 1]}T00:00:00.000Z`);
        const cur = new Date(`${uniqueSorted[i]}T00:00:00.000Z`);
        const diffDays = Math.round((prev.getTime() - cur.getTime()) / 86400000);
        if (diffDays === 1) rolling += 1;
        else rolling = 1;
        if (rolling > bestStreak) bestStreak = rolling;
    }

    return { currentStreak, bestStreak };
}

function calcPerChildStreaks(rows: MiniGameRow[]) {
    const byChild = new Map<string, string[]>();
    for (const row of rows) {
        const list = byChild.get(row.child_id) ?? [];
        list.push(toUtcDateKey(row.played_at));
        byChild.set(row.child_id, list);
    }

    const result = new Map<string, { currentStreak: number; bestStreak: number }>();
    for (const [childId, dates] of byChild) {
        result.set(childId, calcStreaksByDates(dates));
    }

    return result;
}

// POST /mini-games/play
router.post('/play', async (req, res) => {
    const { childId, gameId, score, accuracy, durationSeconds, starsEarned } = req.body;
    if (!childId || !gameId) {
        res.status(400).json({ error: 'Missing required fields: childId, gameId' });
        return;
    }

    const safeScore = Number.isFinite(Number(score)) ? Math.max(0, Math.round(Number(score))) : 0;
    const safeAccuracy = Number.isFinite(Number(accuracy))
        ? Math.min(100, Math.max(0, Number(accuracy)))
        : 0;
    const safeDuration = Number.isFinite(Number(durationSeconds))
        ? Math.max(0, Math.round(Number(durationSeconds)))
        : 0;
    const safeStars = Number.isFinite(Number(starsEarned))
        ? Math.max(0, Math.round(Number(starsEarned)))
        : 0;

    try {
        const { data: inserted, error: insertError } = await supabaseAdmin
            .from('mini_game_sessions')
            .insert({
                child_id: childId,
                game_id: String(gameId),
                score: safeScore,
                accuracy: safeAccuracy,
                duration_seconds: safeDuration,
                stars_earned: safeStars,
            })
            .select()
            .single();

        if (insertError) throw insertError;

        const { data: allRows, error: listError } = await supabaseAdmin
            .from('mini_game_sessions')
            .select('played_at, stars_earned')
            .eq('child_id', childId)
            .order('played_at', { ascending: false });

        if (listError) throw listError;

        const dates = (allRows ?? []).map((r: { played_at: string }) => toUtcDateKey(r.played_at));
        const { currentStreak, bestStreak } = calcStreaksByDates(dates);
        const totalStars = (allRows ?? []).reduce((sum: number, r: { stars_earned: number | null }) => {
            return sum + (r.stars_earned ?? 0);
        }, 0);

        res.status(201).json({
            entry: inserted,
            currentStreak,
            bestStreak,
            totalStars,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /mini-games/stats?parentId=...
router.get('/stats', async (req, res) => {
    const { parentId } = req.query;
    if (!parentId) {
        res.status(400).json({ error: 'Missing required query param: parentId' });
        return;
    }

    try {
        const { data: children, error: childrenError } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name')
            .eq('parent_id', String(parentId))
            .eq('role', 'child');

        if (childrenError) throw childrenError;
        if (!children || children.length === 0) {
            res.json({
                totalPlays: 0,
                avgAccuracy: 0,
                totalDurationSeconds: 0,
                totalStars: 0,
                byGame: [],
                byChild: [],
                bestStreak: 0,
                currentStreak: 0,
            });
            return;
        }

        const childIds = children.map((c) => c.id);
        const childNameMap = new Map<string, string | null>(children.map((c) => [c.id, c.full_name]));

        const { data: rows, error: rowsError } = await supabaseAdmin
            .from('mini_game_sessions')
            .select('child_id, game_id, score, accuracy, duration_seconds, stars_earned, played_at')
            .in('child_id', childIds);

        if (rowsError) throw rowsError;

        const sessions = ((rows ?? []) as MiniGameRow[]);
        const totalPlays = sessions.length;
        const avgAccuracy = totalPlays > 0
            ? Math.round((sessions.reduce((sum, r) => sum + Number(r.accuracy || 0), 0) / totalPlays) * 10) / 10
            : 0;
        const totalDurationSeconds = sessions.reduce((sum, r) => sum + (r.duration_seconds ?? 0), 0);
        const totalStars = sessions.reduce((sum, r) => sum + (r.stars_earned ?? 0), 0);

        const byGameMap = new Map<string, { plays: number; totalScore: number; totalAccuracy: number; totalDurationSeconds: number; totalStars: number }>();
        const byChildMap = new Map<string, { plays: number; totalScore: number; totalAccuracy: number; totalDurationSeconds: number; totalStars: number }>();

        for (const row of sessions) {
            const game = byGameMap.get(row.game_id) ?? { plays: 0, totalScore: 0, totalAccuracy: 0, totalDurationSeconds: 0, totalStars: 0 };
            game.plays += 1;
            game.totalScore += row.score ?? 0;
            game.totalAccuracy += Number(row.accuracy ?? 0);
            game.totalDurationSeconds += row.duration_seconds ?? 0;
            game.totalStars += row.stars_earned ?? 0;
            byGameMap.set(row.game_id, game);

            const child = byChildMap.get(row.child_id) ?? { plays: 0, totalScore: 0, totalAccuracy: 0, totalDurationSeconds: 0, totalStars: 0 };
            child.plays += 1;
            child.totalScore += row.score ?? 0;
            child.totalAccuracy += Number(row.accuracy ?? 0);
            child.totalDurationSeconds += row.duration_seconds ?? 0;
            child.totalStars += row.stars_earned ?? 0;
            byChildMap.set(row.child_id, child);
        }

        const streakByChild = calcPerChildStreaks(sessions);

        const byGame = Array.from(byGameMap.entries())
            .map(([gameId, summary]) => ({
                gameId,
                plays: summary.plays,
                avgScore: Math.round(summary.totalScore / summary.plays),
                avgAccuracy: Math.round((summary.totalAccuracy / summary.plays) * 10) / 10,
                totalDurationSeconds: summary.totalDurationSeconds,
                totalStars: summary.totalStars,
            }))
            .sort((a, b) => b.plays - a.plays);

        const byChild = Array.from(byChildMap.entries())
            .map(([childId, summary]) => {
                const streak = streakByChild.get(childId) ?? { currentStreak: 0, bestStreak: 0 };
                return {
                    childId,
                    fullName: childNameMap.get(childId) ?? null,
                    plays: summary.plays,
                    avgScore: Math.round(summary.totalScore / summary.plays),
                    avgAccuracy: Math.round((summary.totalAccuracy / summary.plays) * 10) / 10,
                    totalDurationSeconds: summary.totalDurationSeconds,
                    totalStars: summary.totalStars,
                    currentStreak: streak.currentStreak,
                    bestStreak: streak.bestStreak,
                };
            })
            .sort((a, b) => b.plays - a.plays);

        const bestStreak = byChild.reduce((max, c) => Math.max(max, c.bestStreak), 0);
        const currentStreak = byChild.reduce((max, c) => Math.max(max, c.currentStreak), 0);

        res.json({
            totalPlays,
            avgAccuracy,
            totalDurationSeconds,
            totalStars,
            byGame,
            byChild,
            bestStreak,
            currentStreak,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
