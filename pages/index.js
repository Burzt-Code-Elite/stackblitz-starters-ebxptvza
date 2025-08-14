import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home() {
  const [user, setUser] = useState(null);
  const [tweets, setTweets] = useState([]);
  const [text, setText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    loadTweets();
  }, []);

  const loadTweets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tweets', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      
      if (response.ok) {
        setTweets(result.tweets);
      } else {
        setMessage('Error loading tweets: ' + result.error);
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
        }
      }
    } catch (error) {
      setMessage('Error loading tweets: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tweets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: text }),
      });

      const result = await response.json();

      if (response.ok) {
        setText('');
        setMessage('Tweet posted successfully!');
        loadTweets();
      } else {
        setMessage('Error: ' + result.error);
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id) => {
    if (!editText.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tweets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: editText }),
      });

      const result = await response.json();

      if (response.ok) {
        setEditingId(null);
        setEditText('');
        setMessage('Tweet updated successfully!');
        loadTweets();
      } else {
        setMessage('Error: ' + result.error);
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this tweet?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tweets/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Tweet deleted successfully!');
        loadTweets();
      } else {
        setMessage('Error: ' + result.error);
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  const startEdit = (tweet) => {
    setEditingId(tweet.id);
    setEditText(tweet.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="centered-container">
      <div className="card mb-4">
        <div className="card-content">
          <h1 className="title mb-3">Tweet Feed</h1>
          <div className="mb-4">
            <span className="mr-3">Welcome, {user.username}!</span>
            <button className="button" onClick={handleLogout}>
              Logout
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mb-4">
            <div className="mb-3">
              <input
                className="input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What's happening?"
                disabled={loading}
              />
            </div>
            <button 
              className="button is-primary"
              type="submit" 
              disabled={loading || !text.trim()}
            >
              {loading ? 'Posting...' : 'Post Tweet'}
            </button>
          </form>

          {message && <p className="mb-3">{message}</p>}
        </div>
      </div>

      <div>
        <h2 className="title is-4 mb-4">All Tweets</h2>
        {tweets.length === 0 ? (
          <p>No tweets yet. Be the first to post!</p>
        ) : (
          tweets.map((tweet) => (
            <div key={tweet.id} className="card mb-3">
              <div className="card-content">
                <div className="mb-2">
                  <strong>@{tweet.username}</strong>
                </div>
                
                {editingId === tweet.id ? (
                  <div>
                    <textarea
                      className="input mb-3"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows="2"
                    />
                    <button 
                      className="button is-success mr-2"
                      onClick={() => handleEdit(tweet.id)}
                      disabled={!editText.trim()}
                    >
                      Save
                    </button>
                    <button 
                      className="button"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-2">{tweet.content}</div>
                    <div className="mb-3">
                      <small>{new Date(tweet.created_at).toLocaleString()}</small>
                    </div>
                    
                    {tweet.user_id === user.id && (
                      <div>
                        <button 
                          className="button mr-2"
                          onClick={() => startEdit(tweet)}
                        >
                          Edit
                        </button>
                        <button 
                          className="button is-danger"
                          onClick={() => handleDelete(tweet.id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}