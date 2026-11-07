import { CapabilityCard } from './CapabilityCard.js';

type Suggestion = { title: string; focus?: string; minutes?: number; difficulty?: string; reason?: string };
type WorkoutsResponse = { suggestions: Suggestion[] };

export default function Workouts() {
  return <CapabilityCard<WorkoutsResponse>
    title="Workout suggestions"
    description="Recommend workouts from activity patterns."
    path={`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`}
    emptyMessage="No workout suggestions are available."
    isEmpty={(data) => data.suggestions.length === 0}
    renderData={(data) => <ul>{data.suggestions.map((suggestion) =>
      <li key={suggestion.title}>
        <strong>{suggestion.title}</strong>{suggestion.focus ? ` — ${suggestion.focus}` : ''}
        {suggestion.minutes ? `, ${suggestion.minutes} minutes` : ''}
        {suggestion.difficulty ? ` (${suggestion.difficulty})` : ''}
        {suggestion.reason ? <p>{suggestion.reason}</p> : null}
      </li>,
    )}</ul>}
  />;
}
