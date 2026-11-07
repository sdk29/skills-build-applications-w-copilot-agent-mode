import { CapabilityCard } from './CapabilityCard.js';

type Entry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: Entry[] };

export default function Leaderboard() {
  return <CapabilityCard<LeaderboardResponse>
    title="Leaderboard"
    description="Compare team point totals."
    path="/api/leaderboard"
    emptyMessage="No leaderboard scores yet."
    isEmpty={(data) => data.leaderboard.length === 0}
    renderData={(data) => <ol>{data.leaderboard.map((entry) =>
      <li key={entry.teamName}>{entry.teamName}: {entry.totalPoints} points</li>,
    )}</ol>}
  />;
}
