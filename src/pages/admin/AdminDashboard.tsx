import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import type { Tournament } from '../../types';

export default function AdminDashboard() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTName, setNewTName] = useState('');
  const [newTSeason, setNewTSeason] = useState('');
  const [newTCategory, setNewTCategory] = useState('');

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'tournaments'));
      const tourneys = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tournament[];
      // client side sort since we don't have a composite index right now
      tourneys.sort((a, b) => b.createdAt - a.createdAt);
      setTournaments(tourneys);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await addDoc(collection(db, 'tournaments'), {
        name: newTName,
        season: newTSeason,
        category: newTCategory,
        status: 'upcoming',
        createdAt: Date.now(), // using client time for simplicity
        bannerUrl: ''
      });
      setNewTName('');
      setNewTSeason('');
      setNewTCategory('');
      await fetchTournaments();
    } catch (err) {
      console.error(err);
      alert('Failed to create tournament');
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-cricket-navy">Admin Dashboard</h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-4">Create New Tournament</h2>
        <form onSubmit={handleCreateTournament} className="flex flex-col sm:flex-row gap-4">
          <input 
            type="text" 
            placeholder="Tournament Name" 
            required 
            value={newTName}
            onChange={e => setNewTName(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cricket-teal"
          />
          <input 
            type="text" 
            placeholder="Season (e.g. 2025)" 
            required 
            value={newTSeason}
            onChange={e => setNewTSeason(e.target.value)}
            className="w-32 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cricket-teal"
          />
          <input 
            type="text" 
            placeholder="Category" 
            required 
            value={newTCategory}
            onChange={e => setNewTCategory(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cricket-teal"
          />
          <button 
            type="submit" 
            disabled={isCreating}
            className="bg-cricket-teal hover:bg-cricket-lightTeal text-white font-bold py-2 px-6 rounded transition-colors disabled:opacity-50"
          >
            Create
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-bold text-cricket-navy mb-4">Manage Tournaments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tournaments.map(t => (
            <div key={t.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">{t.name}</h3>
                <p className="text-sm text-gray-500">{t.category} • {t.season} • Status: {t.status}</p>
              </div>
              <Link 
                to={`/admin/tournament/${t.id}`}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                Manage
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
