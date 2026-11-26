// Inserts funnel version N+1 for a brand. A unique index on {brandId, version}
// guards against two saves at once; on a clash we simply try the next number.
export async function insertFunnelVersion(db, doc) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const latest = await db
      .collection('funnels')
      .findOne({ brandId: doc.brandId, workspaceId: doc.workspaceId }, { sort: { version: -1 }, projection: { version: 1 } });
    const version = (latest?.version || 0) + 1;
    try {
      const { insertedId } = await db.collection('funnels').insertOne({ ...doc, version });
      return { _id: insertedId, ...doc, version };
    } catch (err) {
      if (err.code !== 11000) throw err;
    }
  }
  throw new Error('Could not save a new funnel version');
}
