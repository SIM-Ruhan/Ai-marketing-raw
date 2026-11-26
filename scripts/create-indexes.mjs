import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB || 'marketing_os');

await db.collection('brands').createIndex({ workspaceId: 1, createdAt: -1 });
await db.collection('audits').createIndex({ workspaceId: 1, brandId: 1, createdAt: -1 });
await db.collection('audits').createIndex({ workspaceId: 1, createdAt: -1 });
await db.collection('crawls').createIndex({ auditId: 1 });
await db.collection('crawls').createIndex({ workspaceId: 1, brandId: 1 });
await db.collection('competitors').createIndex({ workspaceId: 1, brandId: 1, createdAt: -1 });
await db.collection('comparisons').createIndex({ workspaceId: 1, brandId: 1, createdAt: -1 });
await db.collection('comparisons').createIndex({ workspaceId: 1, createdAt: -1 });
await db.collection('funnels').createIndex({ workspaceId: 1, brandId: 1, version: -1 });
await db.collection('funnels').createIndex({ brandId: 1, version: 1 }, { unique: true });

console.log('Indexes created');
await client.close();
