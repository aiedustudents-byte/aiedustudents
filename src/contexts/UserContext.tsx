import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface UserContextType {
  user: User | null;
  userName: string;
  userDomain: string;
  collegeId: string;
  collegeName: string;
  updateUserName: (name: string) => void;
  refreshUserData: () => Promise<void>;
  isAdmin: boolean;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState('Student');
  const [userDomain, setUserDomain] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // First, check localStorage for immediate (though potentially stale) UI update
        const userDataString = localStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setUserName(userData.name || 'User');
          setUserDomain(userData.domain || '');
          setCollegeId(userData.collegeId || '');
          setCollegeName(userData.collegeName || '');
          setIsAdmin(userData.role === 'admin' || firebaseUser.email === 'admin@example.com' || firebaseUser.email === 'aiedustudents@gmail.com');
        } else {
          // Fallback if no localStorage
          setUserName(firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User');
          const isUserAdmin = firebaseUser.email === 'admin@example.com' || firebaseUser.email === 'aiedustudents@gmail.com';
          setIsAdmin(isUserAdmin);
          setCollegeId('');
        }

        // Then fetch fresh data from Firestore
        await fetchUserProfile(firebaseUser);
      } else {
        setUserName('Student');
        setUserDomain('');
        setCollegeId('');
        setCollegeName('');
        setIsAdmin(false);
        localStorage.removeItem('userData');
        localStorage.removeItem('authToken');
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchUserProfile = async (firebaseUser: User) => {
    try {
      const profileDoc = await getDoc(doc(db, 'user_profiles', firebaseUser.uid));
      if (profileDoc.exists()) {
        const profileData = profileDoc.data();
        const userRole = (firebaseUser.email === 'admin@example.com' || firebaseUser.email === 'aiedustudents@gmail.com') ? 'admin' : 'student';

        const data = {
          name: profileData.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          domain: profileData.domain || '',
          collegeId: profileData.collegeId || '',
          collegeName: profileData.collegeName || '',
          role: profileData.role || userRole
        };

        setUserName(data.name);
        setUserDomain(data.domain);
        setCollegeId(data.collegeId);
        setCollegeName(data.collegeName);
        setIsAdmin(data.role === 'admin');

        localStorage.setItem('userData', JSON.stringify({
          email: firebaseUser.email,
          uid: firebaseUser.uid,
          ...data
        }));
      }
    } catch (error) {
      console.error("Error fetching user profile from Firestore:", error);
    }
  };

  const refreshUserData = async () => {
    if (auth.currentUser) {
      await fetchUserProfile(auth.currentUser);
    }
  };

  const updateUserName = (name: string) => {
    setUserName(name);

    // Update localStorage
    try {
      const userDataString = localStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        userData.name = name;
        localStorage.setItem('userData', JSON.stringify(userData));

        // Dispatch custom event to notify other components (legacy support)
        window.dispatchEvent(new CustomEvent('userNameUpdated', { detail: { name } }));
      }
    } catch (error) {
      console.error('Error updating user name:', error);
    }
  };

  return (
    <UserContext.Provider value={{ user, userName, userDomain, collegeId, collegeName, updateUserName, refreshUserData, isAdmin, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
