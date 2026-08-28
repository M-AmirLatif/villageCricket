import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query } from 'firebase/firestore';
import { db } from '../firebase';
import type { Tournament, Team, Match } from '../types';
import { Trophy, Calendar } from 'lucide-react';

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
        const tDoc = await getDoc(doc(db, 'tournaments', id));
        if (tDoc.exists()) {
          setTournament({ id: tDoc.id, ...tDoc.data() } as Tournament);
        }

        const teamsSnapshot = await getDocs(collection(db, `tournaments/${id}/teams`));
        const teamsData = teamsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Team));
        
        // Compute rank on the frontend dynamically by sorting
        teamsData.sort((a, b) => {
          if (b.points !== a.points) {
            return b.points - a.points;
          }
          return b.netRunRate - a.netRunRate;
        });
        
        setTeams(teamsData);

        const matchesSnapshot = await getDocs(query(collection(db, `tournaments/${id}/matches`)));
        const matchesData = matchesSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Match));
        // Sort matches by date
        matchesData.sort((a, b) => b.date - a.date);
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
          <div className="absolute inset-0 opacity-20">
            <img src={tournament.bannerUrl} alt="banner" className="w-full h-full object-cover" />
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
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button 
          onClick={() => setActiveTab('standings')}
          className={`flex-1 py-4 text-center font-bold text-sm uppercase tracking-wider ${activeTab === 'standings' ? 'bg-cricket-teal text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
        >
          Points Table
        </button>
        <button 
          onClick={() => setActiveTab('fixtures')}
          className={`flex-1 py-4 text-center font-bold text-sm uppercase tracking-wider ${activeTab === 'fixtures' ? 'bg-cricket-teal text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
        >
          Matches & Results
        </button>
      </div>

      {/* Content */}
      <div className="p-0">
        {activeTab === 'standings' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-cricket-navy border-b border-gray-200">
                  <th className="py-3 px-4 font-bold text-sm">#</th>
                  <th className="py-3 px-4 font-bold text-sm w-full">TEAM</th>
                  <th className="py-3 px-2 font-bold text-sm text-center">P</th>
                  <th className="py-3 px-2 font-bold text-sm text-center">W</th>
                  <th className="py-3 px-2 font-bold text-sm text-center">L</th>
                  <th className="py-3 px-2 font-bold text-sm text-center">D</th>
                  <th className="py-3 px-3 font-bold text-sm text-center text-cricket-teal text-lg">PTS</th>
                  <th className="py-3 px-4 font-bold text-sm text-right">NRR</th>
                </tr>
              </thead>
              <tbody>
                {teams.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-500">No teams have been added yet.</td>
                  </tr>
                ) : (
                  teams.map((team, index) => (
                    <tr key={team.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="w-6 h-6 rounded-full bg-cricket-teal text-white flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {team.logoUrl ? (
                            <img src={team.logoUrl} alt={team.teamName} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold">
                              {team.teamName.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="font-bold text-gray-800">{team.teamName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center text-gray-600 font-medium">{team.matchesPlayed}</td>
                      <td className="py-3 px-2 text-center text-gray-600 font-medium">{team.wins}</td>
                      <td className="py-3 px-2 text-center text-gray-600 font-medium">{team.losses}</td>
                      <td className="py-3 px-2 text-center text-gray-600 font-medium">{team.draws}</td>
                      <td className="py-3 px-3 text-center text-cricket-teal font-bold text-lg">{team.points}</td>
                      <td className="py-3 px-4 text-right text-gray-700 font-medium font-mono">
                        {team.netRunRate > 0 ? '+' : ''}{team.netRunRate.toFixed(3)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'fixtures' && (
          <div className="p-4 sm:p-6 space-y-4">
            {matches.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No matches scheduled or played yet.</div>
            ) : (
              matches.map(match => {
                const teamA = teams.find(t => t.id === match.teamAId);
                const teamB = teams.find(t => t.id === match.teamBId);
                if (!teamA || !teamB) return null;

                return (
                  <div key={match.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-center text-xs text-gray-500 mb-3 border-b border-gray-100 pb-2">
                      <div className="flex items-center gap-1"><Calendar size={14} /> {new Date(match.date).toLocaleDateString()}</div>
                      <div className="uppercase tracking-wide font-bold">{match.result === 'upcoming' ? 'UPCOMING' : 'COMPLETED'}</div>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                           <span className="font-bold">{teamA.teamName}</span>
                        </div>
                        <div className="font-mono font-bold text-lg">{match.teamAScore || '-'} {match.teamAOvers ? `(${match.teamAOvers})` : ''}</div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                           <span className="font-bold">{teamB.teamName}</span>
                        </div>
                        <div className="font-mono font-bold text-lg">{match.teamBScore || '-'} {match.teamBOvers ? `(${match.teamBOvers})` : ''}</div>
                      </div>
                    </div>
                    
                    {match.result !== 'upcoming' && (
                      <div className="mt-3 pt-2 border-t border-gray-100 text-sm font-medium text-cricket-teal text-center">
                        {match.result === 'teamA' ? `${teamA.teamName} won` : 
                         match.result === 'teamB' ? `${teamB.teamName} won` : 
                         match.result === 'tie' ? 'Match Tied' : 'No Result'}
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
