"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

export function getClientAuth(): Auth | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!apiKey || !authDomain || !projectId) return null;
  const app = getApps().length ? getApp() : initializeApp({ apiKey, authDomain, projectId, appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID });
  return getAuth(app);
}
