import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Wrap every API handler: known errors -> clean JSON, unknown errors -> logged, generic 500.
export function route(handler) {
  return async (request, ctx) => {
    try {
      return await handler(request, ctx);
    } catch (err) {
      if (err instanceof HttpError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      console.error('Unhandled API error:', err);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}

export function parseObjectId(id) {
  if (!ObjectId.isValid(id)) throw new HttpError(404, 'Not found');
  return new ObjectId(id);
}
