import { http, HttpResponse } from 'msw';

import {Me, request} from '@/lib/api/clients';
import {groupsFactory, expensesFactory, membersFactory} from "./factories";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const STORAGE_KEY = 'spendwise.mock.session';

type MockSession = { signedIn: boolean; user: Me };

// Signed in by default: OAuth redirects can't be intercepted by a service worker.
const defaultSession: MockSession = {
  signedIn: true,
  user: {
    id: 'mock-user-1',
    displayName: '',
    email: 'dev@spendwise.local',
    profileCompleted: false,
  },
};

function load(): MockSession {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MockSession) : structuredClone(defaultSession);
  } catch {
    return structuredClone(defaultSession);
  }
}

function save(session: MockSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

const unauthorized = () =>
  HttpResponse.json({ error: { code: 'unauthorized' } }, { status: 401 });

export const handlers = [
  http.post(`${API_URL}/auth/logout`, () => {
    save({ ...load(), signedIn: false });
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API_URL}/me`, () => {
    const session = load();
    return session.signedIn ? HttpResponse.json(session.user) : unauthorized();
  }),

  http.patch(`${API_URL}/me`, async ({ request }) => {
    const session = load();
    if (!session.signedIn) return unauthorized();
    const { displayName } = (await request.json()) as { displayName?: string };
    const name = displayName?.trim();
    if (!name) {
      return HttpResponse.json({ error: { code: 'invalid_display_name' } }, { status: 400 });
    }
    session.user = { ...session.user, displayName: name, profileCompleted: true };
    save(session);
    return HttpResponse.json(session.user);
  }),

  http.get(`${API_URL}/groups/:userId`, ({ params }) => {
    return HttpResponse.json(groupsFactory({ userId: params.userId }, 10));
  }),

  http.get(`${API_URL}/groups/group/:groupId`, ({ params }) => {
    const groupId = Array.isArray(params.groupId) ? params.groupId[0] : params.groupId;
    const group = (groupsFactory({ userId: 'mock-user-1', id: groupId, name: groupId.split('-').join(' ') }, 1)[0]);
    return HttpResponse.json(group);
  }),

  http.get(`${API_URL}/groups/group/:groupId/expenses`, ({ params }) => {
    const groupId = Array.isArray(params.groupId) ? params.groupId[0] : params.groupId;
    return HttpResponse.json(expensesFactory({ groupId }));
  }),

  http.get(`${API_URL}/groups/group/:groupId/members`, ({ params }) => {
    const groupId = params.groupId;
    return HttpResponse.json(membersFactory({ groupId }));
  })
];
