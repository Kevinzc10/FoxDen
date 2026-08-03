import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function AuthLayout() {
  const router = useRouter();
  const { authState } = useAuth();

  // This is the app's only automatic auth redirect. Guest users are never
  // forced into this route group; it only exits after authentication succeeds.
  useEffect(() => {
    if (authState === 'synced') {
      router.replace('/');
    }
  }, [authState, router]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
