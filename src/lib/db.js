import clientPromise from '@/lib/mongodb';

// One place that decides which database every query uses.
export async function getDb() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB || 'marketing_os');
}
