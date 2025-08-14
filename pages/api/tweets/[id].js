import { Pool } from 'pg';
import { verifyToken } from '../../../lib/auth';

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

  const { id } = req.query;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ error: 'Valid tweet ID is required' });
  }

  const tweetId = parseInt(id);

  if (req.method === 'PUT') {
    // Edit tweet
    const { content } = req.body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Content is required and must be a non-empty string' });
    }

    try {
      const client = await pool.connect();
      
      try {
        // Check if tweet exists and belongs to the current user
        const checkQuery = 'SELECT user_id FROM tweets WHERE id = $1';
        const checkResult = await client.query(checkQuery, [tweetId]);
        
        if (checkResult.rows.length === 0) {
          return res.status(404).json({ error: 'Tweet not found' });
        }

        if (checkResult.rows[0].user_id !== req.user.userId) {
          return res.status(403).json({ error: 'You can only edit your own tweets' });
        }

        // Update the tweet
        const updateQuery = `
          UPDATE tweets 
          SET content = $1 
          WHERE id = $2 
          RETURNING id, content, created_at, user_id
        `;
        const updateResult = await client.query(updateQuery, [content.trim(), tweetId]);
        
        const updatedTweet = updateResult.rows[0];

        res.status(200).json({
          success: true,
          tweet: {
            ...updatedTweet,
            username: req.user.username
          }
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ 
        error: 'Failed to update tweet',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } else if (req.method === 'DELETE') {
    // Delete tweet
    try {
      const client = await pool.connect();
      
      try {
        // Check if tweet exists and belongs to the current user
        const checkQuery = 'SELECT user_id FROM tweets WHERE id = $1';
        const checkResult = await client.query(checkQuery, [tweetId]);
        
        if (checkResult.rows.length === 0) {
          return res.status(404).json({ error: 'Tweet not found' });
        }

        if (checkResult.rows[0].user_id !== req.user.userId) {
          return res.status(403).json({ error: 'You can only delete your own tweets' });
        }

        // Delete the tweet
        const deleteQuery = 'DELETE FROM tweets WHERE id = $1';
        await client.query(deleteQuery, [tweetId]);

        res.status(200).json({
          success: true,
          message: 'Tweet deleted successfully'
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ 
        error: 'Failed to delete tweet',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}