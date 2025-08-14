import { Pool } from 'pg';
import { verifyToken } from '../../lib/auth';

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
});

export default async function handler(req, res) {
  // Verify authentication for all requests
  try {
    const user = verifyToken(req);
    req.user = user;
  } catch (error) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.method === 'GET') {
    // Get all tweets from all users
    try {
      const client = await pool.connect();
      
      try {
        const query = `
          SELECT t.id, t.content, t.created_at, u.username, t.user_id
          FROM tweets t
          JOIN users u ON t.user_id = u.id
          ORDER BY t.created_at DESC
        `;
        
        const result = await client.query(query);
        
        res.status(200).json({
          success: true,
          tweets: result.rows
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch tweets',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } else if (req.method === 'POST') {
    // Create new tweet
    const { content } = req.body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Content is required and must be a non-empty string' });
    }

    try {
      const client = await pool.connect();
      
      try {
        const query = `
          INSERT INTO tweets (content, user_id, created_at) 
          VALUES ($1, $2, NOW()) 
          RETURNING id, content, created_at
        `;
        const values = [content.trim(), req.user.userId];
        
        const result = await client.query(query, values);
        const insertedText = result.rows[0];
        
        res.status(201).json({
          success: true,
          tweet: {
            ...insertedText,
            username: req.user.username,
            user_id: req.user.userId
          }
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ 
        error: 'Failed to save tweet',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}