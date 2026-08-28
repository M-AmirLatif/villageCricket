export interface Tournament {
  id: string;
  name: string;
  season: string;
  category: string;
  bannerUrl?: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  createdAt: number;
}

export interface Team {
  id: string;
  tournamentId: string;
  teamName: string;
  logoUrl?: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  netRunRate: number;
}

export interface Match {
  id: string;
  tournamentId: string;
  teamAId: string;
  teamBId: string;
  teamAScore?: string; // e.g. "150/4"
  teamAOvers?: string; // e.g. "20.0"
  teamBScore?: string;
  teamBOvers?: string;
  result: 'teamA' | 'teamB' | 'tie' | 'noResult' | 'upcoming';
  date: number;
  venue: string;
}
