"use client";

import { useState, useEffect } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    console.log('useAuth - Setting up auth listener')
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('useAuth - Auth state changed:', {
        hasUser: !!user,
        email: user?.email,
        uid: user?.uid,
      })
      
      setUser(user);
      
      if (user) {
        try {
          const token = await user.getIdToken();
          setToken(token);
          console.log('useAuth - Got token, creating session')
          
          // Create session
          const response = await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
          
          const data = await response.json();
          console.log('useAuth - Session created:', data);
        } catch (error) {
          console.error('useAuth - Session creation error:', error);
        }
      } else {
        console.log('useAuth - No user, clearing token')
        setToken(null);
      }
      
      setLoading(false);
    });

    return () => {
      console.log('useAuth - Cleaning up auth listener')
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  return {
    user,
    loading,
    token,
    signInWithGoogle,
    signOut,
  };
}
