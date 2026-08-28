import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import type { Tournament, Team, Match } from '../../types';

export default function ManageTournament() {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  
  // Forms
  const [newTeamName, setNewTeamName] = useState('');
  
  const [matchTeamA, setMatchTeamA] = useState('');
  const [matchTeamB, setMatchTeamB] = useState('');
  const [matchDate, setMatchDate] = useState('');
  
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!id) return;
    try {
      const tDoc = await getDoc(doc(db, 'tournaments', id));
      if (tDoc.exists()) setTournament({ id: tDoc.id, ...tDoc.data() } as Tournament);

      const teamsSnap = await getDocs(collection(db, `tournaments/${id}/teams`));
      setTeams(teamsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Team)));

      const matchesSnap = await getDocs(collection(db, `tournaments/${id}/matches`));
      setMatches(matchesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Match)).sort((a, b) => b.date - a.date));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

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

  const handleUpdateTeamStats = async (teamId: string, field: keyof Team, value: number) => {
    if (!id) return;
    try {
      await updateDoc(doc(db, `tournaments/${id}/teams`, teamId), {
        [field]: value
      });
      fetchData(); // reload
    } catch (err) {
      alert('Failed to update stats');
    }
  };

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
        venue: 'TBD'
      });
      setMatchTeamA('');
      setMatchTeamB('');
      setMatchDate('');
      fetchData();
    } catch (err) {
      alert('Failed to add match');
    }
  };

  const handleUpdateMatchResult = async (matchId: string, result: string) => {
    if (!id) return;
    try {
      await updateDoc(doc(db, `tournaments/${id}/matches`, matchId), { result });
      
      // Auto-update standings based on result (simplified)
      // Note: In a real robust app, recalculating all from scratch is safer, but here we do incremental if they just set the result once.
      // For this simple version, we recommend the admin to manually adjust P, W, D, L, PTS if they make mistakes, 
      // or we can run a full recount function.
      alert('Match result updated. Please manually update points and NRR for the respective teams in the Teams section below.');
      
      fetchData();
    } catch (err) {
      alert('Failed to update match');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8 pb-20">
      <div>
        <Link to="/admin" className="text-cricket-teal hover:underline mb-4 inline-block">&larr; Back to Dashboard</Link>
        <h1 className="text-2xl font-bold">Manage: {tournament?.name}</h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-4">Add Team</h2>
        <form onSubmit={handleAddTeam} className="flex gap-4">
          <input 
            type="text" 
            placeholder="Team Name" 
            value={newTeamName}
            onChange={e => setNewTeamName(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded"
            required
          />
          <button type="submit" className="bg-cricket-teal text-white px-4 py-2 rounded">Add</button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <h2 className="text-xl font-bold mb-4">Manage Teams (Stats & NRR)</h2>
        <p className="text-sm text-gray-500 mb-4">Update points and NRR manually after matches.</p>
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Team</th>
              <th className="p-2 w-16">P</th>
              <th className="p-2 w-16">W</th>
              <th className="p-2 w-16">L</th>
              <th className="p-2 w-16">D</th>
              <th className="p-2 w-20">PTS</th>
              <th className="p-2 w-32">NRR</th>
            </tr>
          </thead>
          <tbody>
            {teams.map(team => (
              <tr key={team.id} className="border-b border-gray-100">
                <td className="p-2 font-bold">{team.teamName}</td>
                {['matchesPlayed', 'wins', 'losses', 'draws', 'points'].map((field) => (
                  <td key={field} className="p-2">
                    <input 
                      type="number" 
                      value={team[field as keyof Team] as number}
                      onChange={(e) => handleUpdateTeamStats(team.id, field as keyof Team, parseInt(e.target.value) || 0)}
                      className="w-full p-1 border border-gray-300 rounded text-center"
                    />
                  </td>
                ))}
                <td className="p-2">
                  <input 
                    type="number" 
                    step="0.001"
                    value={team.netRunRate}
                    onChange={(e) => handleUpdateTeamStats(team.id, 'netRunRate', parseFloat(e.target.value) || 0)}
                    className="w-full p-1 border border-gray-300 rounded text-center"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-4">Add Match</h2>
        <form onSubmit={handleAddMatch} className="flex gap-4 flex-wrap">
          <select value={matchTeamA} onChange={e => setMatchTeamA(e.target.value)} required className="p-2 border rounded">
            <option value="">Select Team A</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.teamName}</option>)}
          </select>
          <span className="py-2">vs</span>
          <select value={matchTeamB} onChange={e => setMatchTeamB(e.target.value)} required className="p-2 border rounded">
            <option value="">Select Team B</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.teamName}</option>)}
          </select>
          <input type="date" value={matchDate} onChange={e => setMatchDate(e.target.value)} required className="p-2 border rounded"/>
          <button type="submit" className="bg-cricket-teal text-white px-4 py-2 rounded">Schedule Match</button>
        </form>

        <div className="mt-8 space-y-4">
          <h3 className="font-bold">Match List</h3>
          {matches.map(m => {
            const tA = teams.find(t => t.id === m.teamAId)?.teamName || 'Unknown';
            const tB = teams.find(t => t.id === m.teamBId)?.teamName || 'Unknown';
            return (
              <div key={m.id} className="flex items-center gap-4 p-3 border border-gray-200 rounded">
                <div className="w-32 text-sm text-gray-500">{new Date(m.date).toLocaleDateString()}</div>
                <div className="flex-1 font-bold">{tA} vs {tB}</div>
                <div>
                  <select 
                    value={m.result} 
                    onChange={e => handleUpdateMatchResult(m.id, e.target.value)}
                    className="p-1 text-sm border rounded bg-gray-50"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="teamA">{tA} Won</option>
                    <option value="teamB">{tB} Won</option>
                    <option value="tie">Tie</option>
                    <option value="noResult">No Result</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
