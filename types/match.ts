// types/match.ts
export interface Match {
  id: string;
  league_id: string;
  team_id: string | null;
  home_team: string;
  away_team: string;
  venue: string | null;
  date: string | null; // timestamp (ISO) o null
  jornada: number;
  home_score: number | null;
  away_score: number | null;
  competition: string | null;
}
