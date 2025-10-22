import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  try {
    const recordings = await kv.get('gameRecordings') || [];
    return response.status(200).json(recordings);
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}