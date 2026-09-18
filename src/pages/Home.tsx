import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import type { Tournament } from '../types';
import { Trophy } from 'lucide-react';

export default function Home() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTournaments() {
      try {
        const q = query(collection(db, 'tournaments'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const tourneys = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Tournament[];
        setTournaments(tourneys);
      } catch (error) {
        console.error("Error fetching tournaments:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTournaments();
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-gray-500">Loading tournaments...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-cricket-navy mb-8">Tournaments</h1>
      
      {tournaments.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <Trophy className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500">No tournaments found. Admin needs to create one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((t) => (
            <Link 
              key={t.id} 
              to={`/tournament/${t.id}`}
              className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100"
            >
              <div className="bg-cricket-navy relative flex justify-center">
                {t.bannerUrl ? (
                  <img src={t.bannerUrl} alt={t.name} className="w-full h-auto max-h-[500px] object-contain" />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center opacity-20">
                    <Trophy size={48} color="white" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 text-xs font-bold uppercase rounded ${
                    t.status === 'ongoing' ? 'bg-red-500 text-white' :
                    t.status === 'upcoming' ? 'bg-yellow-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {t.status}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h2 className="text-xl font-bold text-gray-900 mb-1">{t.name}</h2>
                <p className="text-sm text-gray-500">{t.category} • {t.season}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
