import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthError(null);
      
      if (currentUser && currentUser.email) {
        try {
          const docRef = doc(db, 'admins', currentUser.email);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
            setAuthError("Document does not exist in 'admins' collection for this email.");
          }
        } catch (error: any) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
          setAuthError(`Permission Denied: ${error.message}`);
        }
      } else {
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, isAdmin, loading, authError };
}
