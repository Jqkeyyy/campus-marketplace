import React, { useState, useEffect } from 'react';
import { messagesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

function Messages() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchConversations(true); // Show loading on initial fetch

    // Poll for new conversations every 10 seconds
    const conversationInterval = setInterval(() => fetchConversations(false), 10000);
    return () => clearInterval(conversationInterval);
  }, []);

  // Poll for new messages when a conversation is selected
  useEffect(() => {
    if (!selectedConversation) return;

    const messageInterval = setInterval(() => {
      loadConversationSilent(selectedConversation);
    }, 3000); // Check every 3 seconds

    return () => clearInterval(messageInterval);
  }, [selectedConversation]);

  const fetchConversations = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const response = await messagesAPI.getConversations();
      setConversations(response.data);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const loadConversation = async (conversation) => {
    try {
      const response = await messagesAPI.getMessages(
        conversation.listing_id,
        conversation.other_user_id
      );
      setMessages(response.data);
      setSelectedConversation(conversation);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  // Silent version for polling - doesn't change selectedConversation
  const loadConversationSilent = async (conversation) => {
    try {
      const response = await messagesAPI.getMessages(
        conversation.listing_id,
        conversation.other_user_id
      );
      setMessages(response.data);
    } catch (err) {
      console.error('Failed to refresh messages:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      await messagesAPI.send({
        listing_id: selectedConversation.listing_id,
        receiver_id: selectedConversation.other_user_id,
        body: newMessage
      });
      
      setNewMessage('');
      // Reload messages
      loadConversation(selectedConversation);
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Messages</h1>

      {conversations.length === 0 ? (
        <div className="empty-state">
          <h2 className="empty-state-title">No messages yet</h2>
          <p className="empty-state-text">
            Start browsing listings and contact sellers!
          </p>
          <Link to="/" className="btn btn-primary">
            Browse Listings
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
          {/* Conversations List */}
          <div className="card" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <h3>Conversations</h3>
            {conversations.map((conv) => (
              <div
                key={`${conv.listing_id}-${conv.other_user_id}`}
                onClick={() => loadConversation(conv)}
                style={{
                  padding: '1rem',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: selectedConversation?.listing_id === conv.listing_id &&
                    selectedConversation?.other_user_id === conv.other_user_id
                    ? 'var(--background)'
                    : 'transparent'
                }}
              >
                <div className="flex gap-2">
                  {conv.listing_image && (
                    <img
                      src={conv.listing_image}
                      alt={conv.title}
                      style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <strong>{conv.title}</strong>
                    <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                      {conv.other_user_name}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {conv.last_message?.substring(0, 50)}
                      {conv.last_message?.length > 50 ? '...' : ''}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Messages Panel */}
          <div className="card">
            {selectedConversation ? (
              <>
                <div className="flex-between mb-3">
                  <div>
                    <h3>{selectedConversation.title}</h3>
                    <p className="text-muted">
                      Chatting with {selectedConversation.other_user_name}
                    </p>
                  </div>
                  <Link
                    to={`/listings/${selectedConversation.listing_id}`}
                    className="btn btn-small btn-outline"
                  >
                    View Listing
                  </Link>
                </div>

                {/* Messages List */}
                <div
                  className="message-list"
                  style={{
                    maxHeight: '400px',
                    overflowY: 'auto',
                    marginBottom: '1rem',
                    padding: '1rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius)'
                  }}
                >
                  {messages.length === 0 ? (
                    <p className="text-muted text-center">No messages yet</p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.message_id}
                        className={`message-item ${
                          msg.sender_id === user.UserID ? 'sent' : 'received'
                        }`}
                        style={{ marginBottom: '1rem' }}
                      >
                        <div className="message-sender" style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                          {msg.sender_name}
                        </div>
                        <div className="message-body" style={{ marginTop: '0.25rem' }}>
                          {msg.body}
                        </div>
                        <div className="message-time" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                          {new Date(msg.sent_at).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Send Message Form */}
                <form onSubmit={handleSendMessage}>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={sending}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={sending || !newMessage.trim()}
                    >
                      {sending ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="empty-state">
                <p>Select a conversation to view messages</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Messages;