import { Activity, Team, User, Workout } from '../models/index.js';

type ObjectInput = Record<string, unknown>;

function isObjectInput(input: unknown): input is ObjectInput {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  if (!isObjectInput(input)) throw badRequest('Activity details are required');
  const { userId, teamId, type, minutes } = input;
  if (typeof userId !== 'string' || !/^[a-f\d]{24}$/i.test(userId) ||
      typeof teamId !== 'string' || !/^[a-f\d]{24}$/i.test(teamId)) {
    throw badRequest('Valid userId and teamId are required');
  }
  if (typeof type !== 'string' || !type.trim()) throw badRequest('Activity type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) {
    throw badRequest('Minutes must be a positive number');
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) throw badRequest('The specified user and team must exist');

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isObjectInput(input)) throw badRequest('Team details are required');
  const { name, mascot } = input;
  const members = input.members ?? [];
  if (typeof name !== 'string' || !name.trim()) throw badRequest('Team name is required');
  if (typeof mascot !== 'string' || !mascot.trim()) throw badRequest('Team mascot is required');
  if (!Array.isArray(members) || members.some((member) => typeof member !== 'string' || !/^[a-f\d]{24}$/i.test(member))) {
    throw badRequest('Team members must be valid user IDs');
  }
  if (members.length > 0) {
    const existingMembers = await User.countDocuments({ _id: { $in: members } });
    if (existingMembers !== new Set(members).size) throw badRequest('All team members must exist');
  }
  return Team.create({ name: name.trim(), mascot: mascot.trim(), members });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().lean(),
    Activity.aggregate<{ _id: unknown; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [String(_id), totalPoints]));
  return teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: pointsByTeam.get(String(team._id)) ?? 0,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

function focusForActivity(type: string) {
  const activityType = type.toLowerCase();
  if (['strength', 'weights', 'resistance'].includes(activityType)) return 'strength';
  if (['yoga', 'stretch', 'mobility'].includes(activityType)) return 'mobility';
  return 'endurance';
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) throw Object.assign(new Error('No user was found for that email'), { status: 404 });

  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean(),
    Workout.find().lean(),
  ]);
  const goal = user.fitnessGoal?.trim().toLowerCase();
  const activity = activities[0];
  const activityFocus = activity ? focusForActivity(activity.type) : undefined;
  const focus = goal && workouts.some((workout) => workout.focus.toLowerCase() === goal)
    ? goal
    : activityFocus;
  const matchingWorkouts = [...workouts].sort((left, right) =>
    Number(right.focus.toLowerCase() === focus) - Number(left.focus.toLowerCase() === focus) ||
    left.title.localeCompare(right.title),
  );

  return matchingWorkouts.map((workout) => ({
    ...workout,
    reason: workout.focus.toLowerCase() === goal
      ? `Matches your ${workout.focus} fitness goal.`
      : workout.focus.toLowerCase() === activityFocus && activity
        ? `Recommended based on your recent ${activity.type} activity.`
        : `A general ${workout.focus} workout suggestion.`,
  }));
}

export { User };
