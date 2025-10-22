import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Only POST requests allowed' });
  }
  try {
    const { url, timestamp } = request.body;
    if (!url || !timestamp) {
      return response.status(400).json({ message: 'URL and timestamp are required' });
    }
    let recordings = await kv.get('gameRecordings') || [];
    recordings.push({ url, timestamp });
    await kv.set('gameRecordings', recordings);
    return response.status(200).json({ message: 'Recording saved successfully' });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}