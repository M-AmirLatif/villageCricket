import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import type { Tournament, Team, Match } from '../../types';

export default function ManageTournament() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const [newTeamName, setNewTeamName] = useState('');
  
  const [matchTeamA, setMatchTeamA] = useState('');
  const [matchTeamB, setMatchTeamB] = useState('');
  const [matchDate, setMatchDate] = useState('');

  const fetchData = async () => {
    if (!id) return;
    try {
      const docSnap = await getDoc(doc(db, 'tournaments', id));
      if (docSnap.exists()) {
        setTournament({ id: docSnap.id, ...docSnap.data() } as Tournament);
      }

      const teamsSnap = await getDocs(collection(db, `tournaments/${id}/teams`));
      setTeams(teamsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Team)));

      const matchesSnap = await getDocs(collection(db, `tournaments/${id}/matches`));
      setMatches(matchesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Match)).sort((a, b) => a.date - b.date));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Teams
  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newTeamName) return;
    try {
      await addDoc(collection(db, `tournaments/${id}/teams`), {
        tournamentId: id,
        teamName: newTeamName,
        logoUrl: '',
        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        points: 0,
        netRunRate: 0
      });
      setNewTeamName('');
      fetchData();
    } catch (err) {
      alert('Failed to add team');
    }
  };

  const handleUpdateTeamStats = async (teamId: string, field: keyof Team, value: number | string) => {
    if (!id) return;
    try {
      await updateDoc(doc(db, `tournaments/${id}/teams`, teamId), {
        [field]: value
      });
      fetchData(); 
    } catch (err) {
      alert('Failed to update stats');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this team?")) return;
    try {
      await deleteDoc(doc(db, `tournaments/${id}/teams`, teamId));
      fetchData();
    } catch (err) {
      alert("Failed to delete team");
    }
  };

  // Matches
  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !matchTeamA || !matchTeamB || !matchDate) return;
    try {
      await addDoc(collection(db, `tournaments/${id}/matches`), {
        tournamentId: id,
        teamAId: matchTeamA,
        teamBId: matchTeamB,
        date: new Date(matchDate).getTime(),
        result: 'upcoming',
        venue: 'TBD',
        teamAScore: '',
        teamAOvers: '',
        teamBScore: '',
        teamBOvers: ''
      });
      setMatchTeamA('');
      setMatchTeamB('');
      setMatchDate('');
      fetchData();
    } catch (err) {
      alert('Failed to add match');
    }
  };

  const handleUpdateMatchField = async (matchId: string, field: string, value: any) => {
    if (!id) return;
    try {
      await updateDoc(doc(db, `tournaments/${id}/matches`, matchId), { [field]: value });
      fetchData();
    } catch (err) {
      alert('Failed to update match');
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this match?")) return;
    try {
      await deleteDoc(doc(db, `tournaments/${id}/matches`, matchId));
      fetchData();
    } catch (err) {
      alert("Failed to delete match");
    }
  };

  const handleDeleteTournament = async () => {
    if (!id) return;
    if (!window.confirm("WARNING: Are you absolutely sure you want to delete this entire tournament? This cannot be undone!")) return;
    try {
      await deleteDoc(doc(db, 'tournaments', id));
      navigate('/admin');
    } catch (err) {
      alert("Failed to delete tournament");
    }
  };

  const handleUpdateTournament = async (field: string, value: string) => {
    if (!id) return;
    try {
      await updateDoc(doc(db, 'tournaments', id), { [field]: value });
      fetchData();
    } catch (err) {
      alert("Failed to update tournament");
    }
  };

  const handleRecalculateStandings = async () => {
    if (!id || !window.confirm("This will overwrite all team stats (P, W, L, D, PTS, NRR) based on the match scores below. Are you sure?")) return;
    
    try {
      const teamStats: Record<string, { matchesPlayed: number, wins: number, losses: number, draws: number, points: number, runsScored: number, oversFaced: number, runsConceded: number, oversBowled: number }> = {};
      
      teams.forEach(t => {
        teamStats[t.id] = { matchesPlayed: 0, wins: 0, losses: 0, draws: 0, points: 0, runsScored: 0, oversFaced: 0, runsConceded: 0, oversBowled: 0 };
      });

      const parseOvers = (oversStr: string) => {
        if (!oversStr) return 0;
        const parts = oversStr.toString().split('.');
        const overs = parseInt(parts[0]) || 0;
        const balls = parseInt(parts[1]) || 0;
        return overs + (balls / 6);
      };

      const parseRuns = (scoreStr: string) => {
        if (!scoreStr) return 0;
        return parseInt(scoreStr.split('/')[0]) || 0;
      };

      matches.forEach(m => {
        if (m.result === 'upcoming') return;
        
        const sA = teamStats[m.teamAId];
        const sB = teamStats[m.teamBId];
        if (!sA || !sB) return;

        sA.matchesPlayed++;
        sB.matchesPlayed++;

        if (m.result === 'teamA') { sA.wins++; sB.losses++; sA.points += 2; }
        else if (m.result === 'teamB') { sB.wins++; sA.losses++; sB.points += 2; }
        else if (m.result === 'tie' || m.result === 'noResult') { 
          sA.draws++; sB.draws++; sA.points += 1; sB.points += 1; 
        }

        const runsA = parseRuns(m.teamAScore || '0');
        const oversA = parseOvers(m.teamAOvers || '0');
        const runsB = parseRuns(m.teamBScore || '0');
        const oversB = parseOvers(m.teamBOvers || '0');

        sA.runsScored += runsA;
        sA.oversFaced += oversA;
        sA.runsConceded += runsB;
        sA.oversBowled += oversB;

        sB.runsScored += runsB;
        sB.oversFaced += oversB;
        sB.runsConceded += runsA;
        sB.oversBowled += oversA;
      });

      for (const t of teams) {
        const stats = teamStats[t.id];
        let nrr = 0;
        if (stats.oversFaced > 0 && stats.oversBowled > 0) {
          nrr = (stats.runsScored / stats.oversFaced) - (stats.runsConceded / stats.oversBowled);
        }
        
        await updateDoc(doc(db, `tournaments/${id}/teams`, t.id), {
          matchesPlayed: stats.matchesPlayed,
          wins: stats.wins,
          losses: stats.losses,
          draws: stats.draws,
          points: stats.points,
          netRunRate: isNaN(nrr) ? 0 : parseFloat(nrr.toFixed(3))
        });
      }

      alert("Standings successfully recalculated!");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to recalculate standings");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div>
          <Link to="/admin" className="text-cricket-teal hover:underline mb-1 inline-block text-sm font-bold">&larr; Dashboard</Link>
          <h1 className="text-xl sm:text-2xl font-black text-cricket-navy uppercase tracking-tight">Manage: {tournament?.name}</h1>
        </div>
        <button onClick={handleDeleteTournament} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-bold shadow-sm transition">
          Delete Tournament
        </button>
      </div>

      {/* Tournament Settings */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 border-l-4 border-l-cricket-navy">
        <h2 className="text-lg font-bold mb-2 text-cricket-navy uppercase">Tournament Picture</h2>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <input 
            type="text" 
            placeholder="Paste Image URL here (e.g. from Imgur or Facebook)" 
            value={tournament?.bannerUrl || ''}
            onChange={(e) => handleUpdateTournament('bannerUrl', e.target.value)}
            className="flex-1 w-full px-4 py-2 border border-gray-300 rounded text-sm"
          />
          {tournament?.bannerUrl && (
            <img src={tournament.bannerUrl} alt="Preview" className="h-10 w-20 object-cover rounded border border-gray-200" />
          )}
        </div>
      </div>

      {/* Add Team Section */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border-t-4 border-t-cricket-teal border border-gray-200">
        <h2 className="text-lg font-bold mb-4 text-cricket-navy uppercase">Add New Team</h2>
        <form onSubmit={handleAddTeam} className="flex flex-col sm:flex-row gap-3">
          <input 
            type="text" 
            placeholder="Enter Team Name..." 
            value={newTeamName}
            onChange={e => setNewTeamName(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded font-bold shadow-inner"
            required
          />
          <button type="submit" className="bg-cricket-navy text-white px-6 py-3 rounded font-bold hover:bg-cricket-teal transition shadow-sm">
            Add Team
          </button>
        </form>
      </div>

      {/* Manage Teams Section */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h2 className="text-lg font-bold text-cricket-navy uppercase">Team Stats & Points Table</h2>
          <button 
            onClick={handleRecalculateStandings}
            className="bg-yellow-400 hover:bg-yellow-500 text-cricket-navy font-bold px-4 py-2 rounded shadow-sm text-sm flex items-center gap-2 transition"
          >
            ⚡ Auto-Calculate from Matches
          </button>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 mb-4 bg-gray-50 p-2 rounded border border-gray-100">
          💡 <strong>Tip:</strong> Click the yellow Auto-Calculate button to compute everything from the match scores automatically, or edit manually. Note: For accurate NRR, make sure to enter overs like '19.4' correctly.
        </p>
        
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle px-4 sm:px-0">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gradient-to-r from-cricket-navy to-cricket-teal text-white">
                  <th className="p-3 text-sm font-black rounded-tl-lg">Team Name</th>
                  <th className="p-3 text-sm font-black text-center w-14">P</th>
                  <th className="p-3 text-sm font-black text-center w-14">W</th>
                  <th className="p-3 text-sm font-black text-center w-14">L</th>
                  <th className="p-3 text-sm font-black text-center w-14">D</th>
                  <th className="p-3 text-sm font-black text-center w-20 text-yellow-300">PTS</th>
                  <th className="p-3 text-sm font-black text-center w-28">NRR</th>
                  <th className="p-3 text-sm font-black text-center w-16 rounded-tr-lg">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teams.map(team => (
                  <tr key={team.id} className="hover:bg-gray-50">
                    <td className="p-2">
                      <input 
                        type="text"
                        value={team.teamName}
                        onChange={(e) => handleUpdateTeamStats(team.id, 'teamName', e.target.value)}
                        className="w-full p-2 border-b border-transparent hover:border-gray-300 focus:border-cricket-teal focus:bg-white bg-transparent font-bold text-gray-800 transition-colors"
                      />
                    </td>
                    {['matchesPlayed', 'wins', 'losses', 'draws', 'points'].map((field) => (
                      <td key={field} className="p-2 text-center">
                        <input 
                          type="number" 
                          value={team[field as keyof Team] as number}
                          onChange={(e) => handleUpdateTeamStats(team.id, field as keyof Team, parseInt(e.target.value) || 0)}
                          className="w-full p-2 border border-gray-200 rounded text-center focus:border-cricket-teal focus:ring-1 focus:ring-cricket-teal shadow-inner font-mono text-sm"
                        />
                      </td>
                    ))}
                    <td className="p-2 text-center">
                      <input 
                        type="number" 
                        step="0.001"
                        value={team.netRunRate}
                        onChange={(e) => handleUpdateTeamStats(team.id, 'netRunRate', parseFloat(e.target.value) || 0)}
                        className="w-full p-2 border border-gray-200 rounded text-center focus:border-cricket-teal focus:ring-1 focus:ring-cricket-teal shadow-inner font-mono text-sm"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button onClick={() => handleDeleteTeam(team.id)} className="text-red-500 hover:text-white hover:bg-red-500 p-2 rounded transition">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {teams.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">No teams added yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Match Section */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 border-t-4 border-t-orange-500">
        <h2 className="text-lg font-bold mb-4 text-cricket-navy uppercase">Schedule a Match</h2>
        <form onSubmit={handleAddMatch} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <select value={matchTeamA} onChange={e => setMatchTeamA(e.target.value)} required className="flex-1 p-3 border border-gray-300 rounded font-bold shadow-inner">
            <option value="">Select Team A...</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.teamName}</option>)}
          </select>
          
          <div className="bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-xs mx-auto shadow-sm">VS</div>
          
          <select value={matchTeamB} onChange={e => setMatchTeamB(e.target.value)} required className="flex-1 p-3 border border-gray-300 rounded font-bold shadow-inner">
            <option value="">Select Team B...</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.teamName}</option>)}
          </select>
          
          <input type="date" value={matchDate} onChange={e => setMatchDate(e.target.value)} required className="flex-1 p-3 border border-gray-300 rounded shadow-inner"/>
          
          <button type="submit" className="bg-cricket-navy text-white px-6 py-3 rounded font-bold hover:bg-orange-600 transition shadow-sm w-full sm:w-auto">
            Schedule
          </button>
        </form>
      </div>

      {/* Manage Matches Section */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold mb-4 text-cricket-navy uppercase">Manage Fixtures & Scores</h2>
        <div className="space-y-4">
          {matches.map(m => {
            const tA = teams.find(t => t.id === m.teamAId)?.teamName || 'Unknown Team';
            const tB = teams.find(t => t.id === m.teamBId)?.teamName || 'Unknown Team';
            
            return (
              <div key={m.id} className="border-2 border-gray-100 rounded-lg p-4 sm:p-5 hover:border-cricket-teal transition bg-gray-50/50 relative">
                
                <button 
                  onClick={() => handleDeleteMatch(m.id)}
                  className="absolute top-2 right-2 text-xs text-red-500 hover:text-white hover:bg-red-500 px-2 py-1 rounded transition"
                >
                  Remove Match
                </button>

                <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 border-b border-gray-200 pb-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Match Date</label>
                    <input 
                      type="date" 
                      value={m.date && !isNaN(new Date(m.date).getTime()) ? new Date(m.date).toISOString().split('T')[0] : ''} 
                      onChange={(e) => {
                        const newTime = new Date(e.target.value).getTime();
                        if (!isNaN(newTime)) {
                          handleUpdateMatchField(m.id, 'date', newTime);
                        }
                      }}
                      className="p-2 border border-gray-300 rounded text-sm font-bold bg-white"
                    />
                  </div>

                  <div className="flex-1 max-w-xs">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Match Result</label>
                    <select 
                      value={m.result} 
                      onChange={e => handleUpdateMatchField(m.id, 'result', e.target.value)}
                      className={`w-full p-2 border rounded font-bold text-sm ${m.result !== 'upcoming' ? 'bg-green-50 border-green-300 text-green-800' : 'bg-white border-gray-300 text-gray-800'}`}
                    >
                      <option value="upcoming">Upcoming Match</option>
                      <option value="teamA">{tA} Won</option>
                      <option value="teamB">{tB} Won</option>
                      <option value="tie">Match Tied</option>
                      <option value="noResult">No Result / Abandoned</option>
                    </select>
                  </div>
                </div>

                {/* Score Editing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Team A Score */}
                  <div className="bg-white p-3 rounded border border-gray-200 flex flex-col sm:flex-row items-center gap-3">
                    <div className="font-bold w-full sm:w-1/3 truncate text-center sm:text-right">{tA}</div>
                    <div className="flex w-full sm:w-2/3 gap-2">
                      <input 
                        type="text" 
                        placeholder="Score (e.g. 154/6)"
                        value={m.teamAScore || ''}
                        onChange={(e) => handleUpdateMatchField(m.id, 'teamAScore', e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded text-center font-mono text-sm"
                      />
                      <input 
                        type="text" 
                        placeholder="Overs (e.g. 20)"
                        value={m.teamAOvers || ''}
                        onChange={(e) => handleUpdateMatchField(m.id, 'teamAOvers', e.target.value)}
                        className="w-20 p-2 border border-gray-300 rounded text-center font-mono text-sm"
                      />
                    </div>
                  </div>

                  {/* Team B Score */}
                  <div className="bg-white p-3 rounded border border-gray-200 flex flex-col sm:flex-row items-center gap-3">
                    <div className="font-bold w-full sm:w-1/3 truncate text-center sm:text-right">{tB}</div>
                    <div className="flex w-full sm:w-2/3 gap-2">
                      <input 
                        type="text" 
                        placeholder="Score (e.g. 150/8)"
                        value={m.teamBScore || ''}
                        onChange={(e) => handleUpdateMatchField(m.id, 'teamBScore', e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded text-center font-mono text-sm"
                      />
                      <input 
                        type="text" 
                        placeholder="Overs (e.g. 20)"
                        value={m.teamBOvers || ''}
                        onChange={(e) => handleUpdateMatchField(m.id, 'teamBOvers', e.target.value)}
                        className="w-20 p-2 border border-gray-300 rounded text-center font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
          {matches.length === 0 && (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">No fixtures scheduled yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
