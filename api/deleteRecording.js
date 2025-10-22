import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Only POST requests allowed' });
  }
  try {
    const { timestamp } = request.body;
    if (!timestamp) {
      return response.status(400).json({ message: 'Timestamp is required to delete' });
    }
    let recordings = await kv.get('gameRecordings') || [];
    const updatedRecordings = recordings.filter(rec => rec.timestamp !== timestamp);
    await kv.set('gameRecordings', updatedRecordings);
    return response.status(200).json({ message: 'Recording deleted' });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}