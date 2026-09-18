import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export default function Navbar() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <nav className="bg-cricket-navy text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl sm:text-2xl font-black tracking-wider uppercase">
              Rasool Nagar <span className="text-cricket-teal">Cricket</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin ? (
              <>
                <Link to="/admin" className="text-sm hover:text-cricket-teal transition-colors">Admin Dashboard</Link>
                <button 
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/admin/login" className="text-sm hover:text-cricket-teal transition-colors opacity-50">
                Admin
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
