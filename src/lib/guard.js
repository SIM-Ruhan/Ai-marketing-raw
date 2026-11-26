import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { HttpError } from '@/lib/http';

// For API routes. workspaceId ALWAYS comes from the verified session, never from the request body.
export async function requireWorkspace() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) throw new HttpError(401, 'Not signed in');

  const workspaceId = session.session.activeOrganizationId;
  if (!workspaceId) throw new HttpError(400, 'No active workspace. Create or select one first.');

  let member = null;
  try {
    member = await auth.api.getActiveMember({ headers: h });
  } catch {
    member = null;
  }
  if (!member) throw new HttpError(403, 'You are not a member of this workspace');

  return { userId: session.user.id, workspaceId: String(workspaceId), role: member.role };
}

// For server components / layouts.
export async function requirePageSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/login');
  if (!session.session.activeOrganizationId) redirect('/onboarding');
  return session;
}
