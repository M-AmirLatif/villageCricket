import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading, authError } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto mt-20 bg-red-50 p-8 rounded-lg text-center border border-red-200">
        <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
        <p className="mb-4">You are logged in as <strong>{user.email}</strong>, but you are not recognized as an admin.</p>
        
        <div className="bg-white text-red-800 p-3 rounded text-sm mb-4 font-mono border border-red-200 text-left overflow-hidden break-words">
          <strong>Debug Error:</strong> {authError || 'Unknown error'}
        </div>

        <p className="text-sm text-gray-600 mb-6">
          If it says permission denied, your Rules are wrong. If it says document does not exist, you need to add your email to the admins collection.
        </p>
        <Link to="/" className="bg-cricket-teal text-white px-4 py-2 rounded hover:bg-cricket-lightTeal">Go Home</Link>
      </div>
    );
  }

  return <>{children}</>;
}
