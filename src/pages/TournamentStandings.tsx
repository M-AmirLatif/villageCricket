import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import type { Tournament, Team, Match } from '../types';
import { Trophy } from 'lucide-react';

export default function TournamentStandings() {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'standings' | 'fixtures'>('standings');

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        const [tDoc, teamsSnapshot, matchesSnapshot] = await Promise.all([
          getDoc(doc(db, 'tournaments', id)),
          getDocs(collection(db, `tournaments/${id}/teams`)),
          getDocs(collection(db, `tournaments/${id}/matches`))
        ]);

        if (tDoc.exists()) {
          setTournament({ id: tDoc.id, ...tDoc.data() } as Tournament);
        }

        const teamsData = teamsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Team));
        
        // Compute rank on the frontend dynamically by sorting
        teamsData.sort((a, b) => {
          if (b.points !== a.points) {
            return b.points - a.points;
          }
          return b.netRunRate - a.netRunRate;
        });
        
        setTeams(teamsData);

        const matchesData = matchesSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Match));
        // Sort matches by date
        matchesData.sort((a, b) => a.date - b.date);
        setMatches(matchesData);

      } catch (error) {
        console.error("Error fetching tournament data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  if (loading) {
    return <div className="text-center py-20">Loading tournament data...</div>;
  }

  if (!tournament) {
    return <div className="text-center py-20">Tournament not found.</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
      {/* Header Banner */}
      <div className="bg-cricket-navy text-white p-6 relative">
        {tournament.bannerUrl && (
          <div className="absolute inset-0 opacity-30">
            <img src={tournament.bannerUrl} alt="banner" className="w-full h-full object-contain" />
          </div>
        )}
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-cricket-teal p-3 rounded-full">
              <Trophy size={32} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-wide">{tournament.name}</h1>
              <p className="text-cricket-lightTeal font-medium">{tournament.category} • {tournament.season}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 p-3 sm:p-4 bg-gray-100 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('standings')}
          className={`flex-1 py-3 px-4 text-center font-black text-sm sm:text-base uppercase tracking-wider rounded-lg transition-all shadow-sm ${activeTab === 'standings' ? 'bg-cricket-teal text-white ring-2 ring-offset-2 ring-cricket-teal' : 'bg-white text-gray-500 hover:text-gray-800 hover:bg-gray-50 border border-gray-200'}`}
        >
          Points Table
        </button>
        <button 
          onClick={() => setActiveTab('fixtures')}
          className={`flex-1 py-3 px-4 text-center font-black text-sm sm:text-base uppercase tracking-wider rounded-lg transition-all shadow-sm ${activeTab === 'fixtures' ? 'bg-cricket-teal text-white ring-2 ring-offset-2 ring-cricket-teal' : 'bg-white text-gray-500 hover:text-gray-800 hover:bg-gray-50 border border-gray-200'}`}
        >
          Matches & Results
        </button>
      </div>

      {/* Content */}
      <div className="p-0">
        {activeTab === 'standings' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="shadow-sm">
                <tr className="bg-gradient-to-r from-cricket-teal to-emerald-600 text-white border-b-4 border-emerald-800 divide-x divide-emerald-500/50">
                  <th className="py-3 px-3 sm:px-4 font-black text-sm rounded-tl-lg">#</th>
                  <th className="py-3 px-3 sm:px-4 font-black text-sm">TEAM</th>
                  <th className="py-3 px-3 sm:px-4 font-black text-sm text-center w-12 sm:w-16">P</th>
                  <th className="py-3 px-3 sm:px-4 font-black text-sm text-center w-12 sm:w-16">W</th>
                  <th className="py-3 px-3 sm:px-4 font-black text-sm text-center w-12 sm:w-16">L</th>
                  <th className="py-3 px-3 sm:px-4 font-black text-sm text-center w-12 sm:w-16">D</th>
                  <th className="py-3 px-4 sm:px-5 font-black text-sm text-center text-yellow-300 text-lg shadow-text bg-emerald-700/30 w-16 sm:w-20">PTS</th>
                  <th className="py-3 px-4 sm:px-6 font-black text-sm text-right rounded-tr-lg w-20 sm:w-24">NRR</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-200 border-x-2 border-b-2 border-gray-200 rounded-b-lg">
                {teams.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500 font-medium bg-gray-50">No teams have been added yet.</td>
                  </tr>
                ) : (
                  teams.map((team, index) => {
                    let rowBg = "even:bg-gray-50 odd:bg-white hover:bg-gray-100";
                    let badgeColor = "bg-cricket-navy text-white";
                    
                    if (index < 2) {
                      // Top 2 Teams (Qualifiers)
                      rowBg = "bg-green-100/40 hover:bg-green-100/70 border-l-4 border-l-green-500";
                      badgeColor = "bg-green-600 text-white shadow-md ring-2 ring-green-300";
                    } else if (index === 2 || index === 3) {
                      // 3rd and 4th Teams (Eliminator / Playoffs)
                      rowBg = "bg-blue-50/60 hover:bg-blue-100/70 border-l-4 border-l-blue-400";
                      badgeColor = "bg-blue-500 text-white shadow-md ring-2 ring-blue-200";
                    } else {
                      // 5th and below Teams (Eliminated)
                      rowBg = "bg-red-50/50 hover:bg-red-100/60 border-l-4 border-l-red-400";
                      badgeColor = "bg-red-500 text-white shadow-md ring-2 ring-red-200";
                    }

                    return (
                    <tr key={team.id} className={`${rowBg} transition-colors divide-x divide-gray-100 group`}>
                      <td className="py-3 px-3 sm:px-4">
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-black ${badgeColor}`}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <div className="flex items-center gap-3">
                          {team.logoUrl && (
                            <img src={team.logoUrl} alt={team.teamName} className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm" />
                          )}
                          <span className="font-bold text-gray-900 text-sm sm:text-base tracking-tight">{team.teamName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-center text-gray-700 font-bold">{team.matchesPlayed}</td>
                      <td className="py-3 px-3 sm:px-4 text-center text-green-700 font-bold">{team.wins}</td>
                      <td className="py-3 px-3 sm:px-4 text-center text-red-600 font-bold">{team.losses}</td>
                      <td className="py-3 px-3 sm:px-4 text-center text-gray-500 font-bold">{team.draws}</td>
                      <td className="py-3 px-4 sm:px-5 text-center text-cricket-teal font-black text-xl bg-emerald-50/50 group-hover:bg-emerald-100">{team.points}</td>
                      <td className={`py-3 px-4 sm:px-6 text-right font-black font-mono tracking-tighter ${team.netRunRate >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {team.netRunRate > 0 ? '+' : ''}{team.netRunRate.toFixed(3)}
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'fixtures' && (
          <div className="p-3 sm:p-6 space-y-6 bg-gray-50">
            {matches.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow-sm">No matches scheduled or played yet.</div>
            ) : (
              matches.map(match => {
                const teamA = teams.find(t => t.id === match.teamAId);
                const teamB = teams.find(t => t.id === match.teamBId);
                if (!teamA || !teamB) return null;

                const matchDate = new Date(match.date);
                const isValidDate = !isNaN(matchDate.getTime());
                const dayOfWeek = isValidDate ? matchDate.toLocaleDateString(undefined, { weekday: 'long' }) : 'Unknown';
                const fullDate = isValidDate ? matchDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Invalid Date';

                return (
                  <div key={match.id} className="bg-white border-2 border-cricket-navy/10 rounded-xl overflow-hidden shadow-md transition hover:shadow-lg">
                    {/* Date Header */}
                    <div className="bg-gradient-to-r from-cricket-navy to-cricket-teal text-white py-2 px-4 flex justify-between items-center">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                        <span className="font-bold text-sm sm:text-base uppercase tracking-wider text-yellow-300">{dayOfWeek}</span>
                        <span className="hidden sm:inline text-white/50">•</span>
                        <span className="text-sm font-medium">{fullDate}</span>
                      </div>
                      <div className="bg-white/20 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                        {match.result === 'upcoming' ? 'UPCOMING' : 'COMPLETED'}
                      </div>
                    </div>
                    
                    {/* Teams and Scores */}
                    <div className="p-4 sm:p-6">
                      <div className="flex items-center justify-between gap-2 sm:gap-4">
                        {/* Team A */}
                        <div className="flex-1 flex flex-col items-end">
                          <span className="font-bold text-right text-base sm:text-xl text-gray-800 leading-tight mb-2">{teamA.teamName}</span>
                          {match.result !== 'upcoming' && (
                            <table className="mt-1">
                              <tbody>
                                <tr>
                                  <td className="text-left text-gray-400 uppercase tracking-wider font-bold text-[10px] sm:text-xs pr-2">Runs:</td>
                                  <td className="text-left text-cricket-teal font-mono font-bold text-sm sm:text-base">{match.teamAScore || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="text-left text-gray-400 uppercase tracking-wider font-bold text-[10px] sm:text-xs pr-2">Overs:</td>
                                  <td className="text-left text-cricket-teal font-mono font-bold text-sm sm:text-base">{match.teamAOvers || '-'}</td>
                                </tr>
                              </tbody>
                            </table>
                          )}
                        </div>
                        
                        {/* VS Badge */}
                        <div className="bg-gradient-to-br from-red-500 to-orange-500 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-md flex-shrink-0 z-10 border-2 border-white">
                          VS
                        </div>
                        
                        {/* Team B */}
                        <div className="flex-1 flex flex-col items-start">
                          <span className="font-bold text-left text-base sm:text-xl text-gray-800 leading-tight mb-2">{teamB.teamName}</span>
                          {match.result !== 'upcoming' && (
                            <table className="mt-1">
                              <tbody>
                                <tr>
                                  <td className="text-left text-gray-400 uppercase tracking-wider font-bold text-[10px] sm:text-xs pr-2">Runs:</td>
                                  <td className="text-left text-cricket-teal font-mono font-bold text-sm sm:text-base">{match.teamBScore || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="text-left text-gray-400 uppercase tracking-wider font-bold text-[10px] sm:text-xs pr-2">Overs:</td>
                                  <td className="text-left text-cricket-teal font-mono font-bold text-sm sm:text-base">{match.teamBOvers || '-'}</td>
                                </tr>
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Result Footer */}
                    {match.result !== 'upcoming' && (
                      <div className="bg-gray-50 py-3 text-center border-t border-gray-100 px-4">
                        <span className="inline-block px-4 py-1.5 rounded-full bg-green-100 text-green-800 font-bold text-sm shadow-sm">
                          {match.resultString ? match.resultString : (
                            match.result === 'teamA' ? `${teamA.teamName} won` : 
                            match.result === 'teamB' ? `${teamB.teamName} won` : 
                            match.result === 'tie' ? 'Match Tied' : 'No Result'
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-xs text-gray-400 text-right">
        Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  );
}
