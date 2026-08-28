import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import TournamentStandings from './pages/TournamentStandings';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLogin from './pages/admin/AdminLogin';
import ManageTournament from './pages/admin/ManageTournament';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

function App() {
  const isFirebaseConfigured = !!import.meta.env.VITE_FIREBASE_API_KEY;

  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Firebase Configuration Missing</h1>
          <p className="text-gray-700 mb-4">
            It looks like you haven't set up your Firebase environment variables yet.
          </p>
          <p className="text-gray-700 mb-4 text-left">
            1. Copy <code className="bg-gray-100 px-1 rounded">.env.example</code> to a new file named <code className="bg-gray-100 px-1 rounded">.env</code><br/>
            2. Fill in your Firebase project credentials in the <code className="bg-gray-100 px-1 rounded">.env</code> file.<br/>
            3. Restart the Vite development server.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tournament/:id" element={<TournamentStandings />} />
            
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/tournament/:id" element={<ProtectedRoute><ManageTournament /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
