import { CapabilityCard } from './CapabilityCard.js';

type Activity = { type: string; minutes: number; points: number };
type ActivitiesResponse = { activities: Activity[] };

export default function Activities() {
  return <CapabilityCard<ActivitiesResponse>
    title="Activities"
    description="Track student activity minutes and points."
    path="/api/activities"
    emptyMessage="No activities yet."
    isEmpty={(data) => data.activities.length === 0}
    renderData={(data) => <ul>{data.activities.map((activity, index) =>
      <li key={`${activity.type}-${index}`}>{activity.type}: {activity.minutes} minutes, {activity.points} points</li>,
    )}</ul>}
  />;
}
