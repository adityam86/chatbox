import React, { useState } from 'react';
import { X, Plus, Trash2, BarChart2 } from 'lucide-react';

export default function CreatePollModal({ isOpen, onClose, onCreatePoll }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (options.length < 8) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (val, index) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!question.trim()) {
      setError('Please enter a poll question.');
      return;
    }

    const validOptions = options.map((opt) => opt.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      setError('Please provide at least two valid options.');
      return;
    }

    setError('');
    onCreatePoll({
      isPoll: true,
      question: question.trim(),
      options: validOptions.map((text, i) => ({
        id: i + 1,
        text,
        votes: [], // user IDs who voted
      })),
      allowMultiple,
      createdAt: new Date().toISOString(),
    });

    // Reset and close
    setQuestion('');
    setOptions(['', '']);
    setAllowMultiple(false);
    onClose();
  };

  return (
    <div
      className="fade-in"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#0D1220',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--aurora-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <BarChart2 size={18} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Create a Poll
            </h3>
          </div>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {error && (
            <div
              style={{
                backgroundColor: 'rgba(255, 92, 112, 0.12)',
                borderLeft: '4px solid var(--danger)',
                padding: '8px 12px',
                borderRadius: '6px',
                color: '#ff8080',
                fontSize: '13px',
              }}
            >
              {error}
            </div>
          )}

          {/* Question Input */}
          <div>
            <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Poll Question
            </label>
            <input
              type="text"
              placeholder="Ask a question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontSize: '14.5px',
              }}
            />
          </div>

          {/* Options */}
          <div>
            <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              Options
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {options.map((opt, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => handleOptionChange(e.target.value, idx)}
                    style={{
                      flex: 1,
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                    }}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => handleRemoveOption(idx)}
                      style={{ color: 'var(--danger)', padding: '6px' }}
                      title="Remove option"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 8 && (
              <button
                type="button"
                onClick={handleAddOption}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginTop: '10px',
                  fontWeight: '600',
                  padding: 0,
                }}
              >
                <Plus size={16} />
                <span>Add option</span>
              </button>
            )}
          </div>

          {/* Multiple Answers Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
            }}
          >
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Allow multiple answers
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Voters can choose more than one option
              </div>
            </div>
            <input
              type="checkbox"
              checked={allowMultiple}
              onChange={(e) => setAllowMultiple(e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                accentColor: 'var(--accent)',
                cursor: 'pointer',
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-primary"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              marginTop: '8px',
              fontSize: '14.5px',
            }}
          >
            Send Poll
          </button>
        </form>
      </div>
    </div>
  );
}
