import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

// Helper for local storage
const DB_KEY = 'annadaan_dummy_users';
const SESSION_KEY = 'annadaan_dummy_session';

const getDb = () => {
  const data = localStorage.getItem(DB_KEY);
  return data ? JSON.parse(data) : [];
}
const saveDb = (users) => localStorage.setItem(DB_KEY, JSON.stringify(users));

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial session load
    setTimeout(() => {
       const session = localStorage.getItem(SESSION_KEY);
       if (session) {
         try {
           const userData = JSON.parse(session);
           setUser(userData);
           setProfile(userData);
         } catch(e) {}
       }
       setLoading(false);
    }, 500)
  }, [])

  // ── Dummy Register ───────────────────────────────────────────
  async function dummyRegister(identifier) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = getDb();
        if (users.find(u => u.identifier === identifier)) {
           return reject(new Error('User already exists! Please go to Login.'));
        }
        const newUser = { id: Date.now().toString(), identifier, created_at: new Date().toISOString() };
        users.push(newUser);
        saveDb(users);
        
        // Auto-login
        localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
        setUser(newUser);
        setProfile(newUser);
        
        resolve({ user: newUser });
      }, 500);
    });
  }

  // ── Dummy Login ─────────────────────────────────────────────
  async function dummyLogin(identifier) {
    return new Promise((resolve, reject) => {
       setTimeout(() => {
         const users = getDb();
         const found = users.find(u => u.identifier === identifier);
         if (!found) {
            return reject(new Error('User not found. Please check your details or register.'));
         }
         
         // Login
         localStorage.setItem(SESSION_KEY, JSON.stringify(found));
         setUser(found);
         setProfile(found);
         resolve({ user: found });
       }, 500);
    });
  }

  // ── Sign Out ────────────────────────────────────────────────
  async function signOut() {
     return new Promise(resolve => {
        setTimeout(() => {
           localStorage.removeItem(SESSION_KEY);
           setUser(null);
           setProfile(null);
           resolve();
        }, 300);
     });
  }

  const value = {
    user,
    profile,
    loading,
    dummyRegister,
    dummyLogin,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
