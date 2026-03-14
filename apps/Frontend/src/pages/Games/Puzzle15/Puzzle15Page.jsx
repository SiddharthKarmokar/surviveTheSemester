import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Client } from 'colyseus.js';
import './puzzle15.css';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const BACKEND_URL = import.meta.env.VITE_TWO_PLAYER_GAME_URL || 'http://localhost:3000';
const WS_URL = BACKEND_URL.replace(/^http/, 'ws');

// Solved state: [1,2,...,15,0]
const SOLVED = [...Array(15).keys()].map(i => i + 1).concat(0);

function calcProgress(tiles) {
  if (!tiles || tiles.length !== 16) return 0;
  let correct = 0;
  for (let i = 0; i < 15; i++) {
    if (tiles[i] === SOLVED[i]) correct++;
  }
  return Math.round((correct / 15) * 100);
}

async function requestSeatReservation(method, idOrRoomName, payload) {
  const response = await fetch(`${BACKEND_URL}/matchmake/${method}/${idOrRoomName}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload || {}),
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Invalid matchmaking response from server');
  }

  if (!response.ok || data?.error) {
    throw new Error(data?.error || `Matchmake failed (${response.status})`);
  }

  // Normalize 0.16/0.17 reservation shape differences.
  if (data && !data.room && data.roomId) {
    data.room = {
      name: data.name || 'puzzle15',
      roomId: data.roomId,
      processId: data.processId,
      publicAddress: data.publicAddress,
      createdAt: data.createdAt,
    };
  }

  if (!data?.room?.name) {
    data.room = {
      ...(data?.room || {}),
      name: 'puzzle15',
      roomId: data?.room?.roomId || data?.roomId,
      processId: data?.room?.processId || data?.processId,
      publicAddress: data?.room?.publicAddress || data?.publicAddress,
      createdAt: data?.room?.createdAt || data?.createdAt,
    };
  }

  return data;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function Puzzle15Page() {
  const currentUser = useSelector(state => state.user.currentUser);
  const playerName = String(currentUser?.name || currentUser?.username || 'Player').slice(0, 16);

  // -- screen state machine --
  // "lobby"      → pick create or browse
  // "waiting"    → created room, showing invite link, waiting for opponent
  // "browsing"   → fetching and showing available rooms
  // "joining"    → mid-join spinner
  // "countdown"  → 3-2-1 animation
  // "game"       → active race
  // "ended"      → winner overlay
  const [screen, setScreen] = useState('lobby');

  // -- room / colyseus --
  const clientRef = useRef(null);
  const roomRef   = useRef(null);

  // -- lobby --
  const [inviteLink, setInviteLink]       = useState('');
  const [waitingMsg, setWaitingMsg]       = useState('');
  const [availableRooms, setAvailableRooms] = useState([]);
  const [browsing, setBrowsing]           = useState(false);
  const [copied, setCopied]               = useState(false);

  // -- countdown --
  const [countdown, setCountdown] = useState(3);

  // -- game --
  const [myTiles, setMyTiles]           = useState(null); // Array<number>(16)
  const [opponentData, setOpponentData] = useState(null); // {name,moves,solved,tiles}
  const [myMoves, setMyMoves]           = useState(0);
  const [mySessionId, setMySessionId]   = useState('');

  // -- ended --
  const [endData, setEndData] = useState(null); // {winnerName, moves, reason, isMe}

  // -- error --
  const [error, setError] = useState('');

  // ---------------------------------------------------------------------------
  // On mount: check for invite link roomId in URL
  // ---------------------------------------------------------------------------
  useEffect(() => {
    clientRef.current = new Client(WS_URL);
    const params = new URLSearchParams(window.location.search);
    const roomId  = params.get('roomId');
    if (roomId) {
      joinRoomById(roomId);
    }
    return () => {
      // Cleanup on unmount
      if (roomRef.current) {
        roomRef.current.leave();
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Attach Colyseus room listeners
  // ---------------------------------------------------------------------------
  const attachRoomListeners = useCallback((room) => {
    setMySessionId(room.sessionId);

    // Full state sync
    room.onStateChange(state => {
      const me = state.players.get(room.sessionId);
      if (me) {
        setMyTiles([...me.tiles]);
        setMyMoves(me.moves);
      }

      // Find opponent
      state.players.forEach((player, id) => {
        if (!player) return;
        if (id !== room.sessionId) {
          setOpponentData({
            name: player?.name || 'Opponent',
            moves: player?.moves || 0,
            solved: Boolean(player?.solved),
            tiles: Array.isArray(player?.tiles) ? [...player.tiles] : [...(player?.tiles || [])],
          });
        }
      });

      // Phase-driven screen transitions from server state
      if (state.phase === 'game' && screen !== 'game') {
        setScreen('game');
      }
    });

    // Specific messages
    room.onMessage('playerJoined', (data) => {
      const name = data?.name || 'Player';
      const count = data?.count || 0;
      setWaitingMsg(`${name} joined! (${count}/2)`);
    });

    room.onMessage('playerLeft', (data) => {
      const name = data?.name || 'Player';
      setWaitingMsg(`${name} left the room.`);
    });

    room.onMessage('countdown', (data) => {
      setScreen('countdown');
      const target = data.endsAt;
      const tick = () => {
        const remaining = Math.ceil((target - Date.now()) / 1000);
        setCountdown(remaining > 0 ? remaining : 0);
        if (remaining > 0) setTimeout(tick, 250);
      };
      tick();
    });

    room.onMessage('gameStart', () => {
      setScreen('game');
    });

    room.onMessage('ended', (data) => {
      setEndData({
        winnerName: data?.winnerName || 'Player',
        moves: data?.moves || 0,
        reason: data?.reason || 'solved',
        isMe: data?.winner === room.sessionId,
      });
      setScreen('ended');
    });

    room.onError((code, message) => {
      setError(`Connection error (${code}): ${message}`);
    });

    room.onLeave(() => {
      if (screen !== 'ended') {
        setError('Disconnected from room.');
      }
    });
  }, [screen]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  const createRoom = async () => {
    try {
      setError('');
      const reservation = await requestSeatReservation('create', 'puzzle15', { playerName });
      const room = await clientRef.current.consumeSeatReservation(reservation);
      roomRef.current = room;
      const roomId = room.roomId || reservation.roomId || reservation.room?.roomId;
      const link = `${window.location.origin}/puzzle?roomId=${roomId}`;
      setInviteLink(link);
      setScreen('waiting');
      attachRoomListeners(room);
    } catch (err) {
      setError('Could not create room: ' + err.message);
    }
  };

  const fetchAvailableRooms = async () => {
    try {
      setBrowsing(true);
      setError('');
      const response = await fetch(`${BACKEND_URL}/api/games/puzzle15/rooms`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });

      let rooms = [];
      try {
        rooms = await response.json();
      } catch {
        throw new Error('Invalid rooms response from server');
      }

      if (!response.ok) {
        throw new Error(rooms?.error || `Could not fetch rooms (${response.status})`);
      }

      if (!Array.isArray(rooms)) {
        throw new Error('Rooms response is not a list');
      }

      setAvailableRooms(rooms);
    } catch (err) {
      setError('Could not fetch rooms: ' + err.message);
    } finally {
      setBrowsing(false);
    }
  };

  const joinRoom = async (roomId) => {
    try {
      setError('');
      setScreen('joining');
      const reservation = await requestSeatReservation('joinById', roomId, { playerName });
      const room = await clientRef.current.consumeSeatReservation(reservation);
      roomRef.current = room;
      attachRoomListeners(room);
    } catch (err) {
      setScreen('browsing');
      setError('Could not join: ' + err.message);
    }
  };

  const joinRoomById = async (roomId) => {
    try {
      setError('');
      setScreen('joining');
      const reservation = await requestSeatReservation('joinById', roomId, { playerName });
      const room = await clientRef.current.consumeSeatReservation(reservation);
      roomRef.current = room;
      attachRoomListeners(room);
    } catch (err) {
      setScreen('lobby');
      setError('Invite link is invalid or the room is full. Please create a new room.');
    }
  };

  const sendMove = (tileIndex) => {
    if (roomRef.current && screen === 'game') {
      roomRef.current.send('move', { tileIndex });
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const goToDashboard = () => {
    if (roomRef.current) roomRef.current.leave();
    window.location.href = '/dashboard';
  };

  const playAgain = () => {
    if (roomRef.current) roomRef.current.leave();
    roomRef.current = null;
    setScreen('lobby');
    setMyTiles(null);
    setOpponentData(null);
    setMyMoves(0);
    setEndData(null);
    setInviteLink('');
    setAvailableRooms([]);
    setError('');
  };

  // ---------------------------------------------------------------------------
  // Render: tile click on the game board
  // When you click a tile, its index is sent to the server.
  // The server validates adjacency and swaps — state comes back via schema sync.
  // ---------------------------------------------------------------------------
  const renderBoard = (tiles, isMe, disabled) => {
    if (!tiles || tiles.length !== 16) return null;
    return (
      <div className={`p15-board ${disabled ? 'p15-board--disabled' : ''}`}>
        {tiles.map((val, idx) => (
          <div
            key={idx}
            className={`p15-tile ${val === 0 ? 'p15-tile--empty' : ''} ${isMe && val !== 0 ? 'p15-tile--clickable' : ''}`}
            onClick={() => isMe && !disabled && val !== 0 && sendMove(idx)}
          >
            {val !== 0 ? val : ''}
          </div>
        ))}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Screens
  // ---------------------------------------------------------------------------

  if (screen === 'lobby') {
    return (
      <div className="p15-page">
        <button className="p15-back" onClick={goToDashboard}>← Dashboard</button>
        <div className="p15-card p15-lobby">
          <h1 className="p15-title">15 Puzzle Race</h1>
          <p className="p15-subtitle">
            You and an opponent get the same shuffled puzzle. First to solve it wins.
          </p>
          {error && <p className="p15-error">{error}</p>}
          <div className="p15-lobby-actions">
            <button className="p15-btn p15-btn--primary" onClick={createRoom}>
              Create Room &amp; Invite Friend
            </button>
            <span className="p15-lobby-or">or</span>
            <button
              className="p15-btn p15-btn--secondary"
              onClick={() => { setScreen('browsing'); fetchAvailableRooms(); }}
            >
              Browse Open Rooms
            </button>
          </div>
          <p className="p15-hint">Playing as <strong>{playerName}</strong></p>
        </div>
      </div>
    );
  }

  if (screen === 'waiting') {
    return (
      <div className="p15-page">
        <button className="p15-back" onClick={goToDashboard}>← Dashboard</button>
        <div className="p15-card p15-waiting">
          <div className="p15-spinner" />
          <h2 className="p15-title">Waiting for opponent…</h2>
          {waitingMsg && <p className="p15-status-badge">{waitingMsg}</p>}
          <p className="p15-invite-label">Share this invite link:</p>
          <div className="p15-invite-row">
            <input
              className="p15-invite-input"
              readOnly
              value={inviteLink}
              onFocus={e => e.target.select()}
            />
            <button
              className={`p15-btn p15-btn--copy ${copied ? 'p15-btn--copied' : ''}`}
              onClick={copyInviteLink}
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          {error && <p className="p15-error">{error}</p>}
        </div>
      </div>
    );
  }

  if (screen === 'browsing') {
    return (
      <div className="p15-page">
        <button className="p15-back" onClick={() => setScreen('lobby')}>← Back</button>
        <div className="p15-card p15-browse">
          <h2 className="p15-title">Open Rooms</h2>
          {error && <p className="p15-error">{error}</p>}
          {browsing && <div className="p15-spinner" />}
          {!browsing && availableRooms.length === 0 && (
            <p className="p15-empty-rooms">No open rooms right now.</p>
          )}
          {!browsing && availableRooms.length > 0 && (
            <ul className="p15-room-list">
              {availableRooms.map(r => (
                <li key={r.roomId} className="p15-room-item">
                  <span className="p15-room-creator">
                    {r.metadata?.creatorName || 'Player'}'s room
                  </span>
                  <span className="p15-room-count">{r.clients}/2</span>
                  <button
                    className="p15-btn p15-btn--join"
                    onClick={() => joinRoom(r.roomId)}
                  >
                    Join
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            className="p15-btn p15-btn--secondary p15-refresh-btn"
            onClick={fetchAvailableRooms}
            disabled={browsing}
          >
            {browsing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'joining') {
    return (
      <div className="p15-page">
        <div className="p15-card p15-waiting">
          <div className="p15-spinner" />
          <h2 className="p15-title">Joining room…</h2>
        </div>
      </div>
    );
  }

  if (screen === 'countdown') {
    return (
      <div className="p15-page">
        <div className="p15-card p15-countdown-card">
          <p className="p15-countdown-label">Get Ready!</p>
          <div className="p15-countdown-number">{countdown || 'GO!'}</div>
          {opponentData && (
            <p className="p15-opponent-name">vs <strong>{opponentData.name}</strong></p>
          )}
        </div>
      </div>
    );
  }

  if (screen === 'game') {
    const myProgress   = calcProgress(myTiles);
    const oppProgress  = calcProgress(opponentData?.tiles);

    return (
      <div className="p15-page p15-page--game">
        <div className="p15-game-layout">
          {/* --- My side --- */}
          <div className="p15-player-panel">
            <div className="p15-player-header">
              <span className="p15-player-label">You ({playerName})</span>
              <span className="p15-moves">{myMoves} moves</span>
            </div>
            <div className="p15-progress-bar">
              <div className="p15-progress-fill p15-progress-fill--me" style={{ width: `${myProgress}%` }} />
            </div>
            <span className="p15-progress-text">{myProgress}%</span>
            {renderBoard(myTiles, true, false)}
          </div>

          {/* --- VS divider --- */}
          <div className="p15-vs">
            <span>VS</span>
            <button className="p15-quit-btn" onClick={goToDashboard} title="Quit">✕</button>
          </div>

          {/* --- Opponent side --- */}
          <div className="p15-player-panel">
            <div className="p15-player-header">
              <span className="p15-player-label">{opponentData?.name || 'Waiting…'}</span>
              <span className="p15-moves">{opponentData?.moves ?? 0} moves</span>
            </div>
            <div className="p15-progress-bar">
              <div className="p15-progress-fill p15-progress-fill--opp" style={{ width: `${oppProgress}%` }} />
            </div>
            <span className="p15-progress-text">{oppProgress}%</span>
            {renderBoard(opponentData?.tiles, false, true)}
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'ended') {
    const { winnerName, moves, reason, isMe } = endData || {};
    return (
      <div className="p15-page">
        <div className="p15-card p15-ended">
          <div className={`p15-winner-badge ${isMe ? 'p15-winner-badge--win' : 'p15-winner-badge--lose'}`}>
            {isMe ? '🏆 You Win!' : '😔 You Lose'}
          </div>
          <h2 className="p15-winner-name">{winnerName} wins!</h2>
          {reason === 'opponent_left' ? (
            <p className="p15-ended-reason">Opponent disconnected.</p>
          ) : (
            <p className="p15-ended-reason">Solved in <strong>{moves}</strong> moves.</p>
          )}

          {/* Final side-by-side boards */}
          <div className="p15-ended-boards">
            <div className="p15-ended-board-wrap">
              <p className="p15-ended-board-label">Your board</p>
              {renderBoard(myTiles, false, true)}
              <p className="p15-ended-move-count">{myMoves} moves</p>
            </div>
            {opponentData && (
              <div className="p15-ended-board-wrap">
                <p className="p15-ended-board-label">{opponentData.name}</p>
                {renderBoard(opponentData.tiles, false, true)}
                <p className="p15-ended-move-count">{opponentData.moves} moves</p>
              </div>
            )}
          </div>

          <div className="p15-ended-actions">
            <button className="p15-btn p15-btn--primary" onClick={playAgain}>
              Play Again
            </button>
            <button className="p15-btn p15-btn--secondary" onClick={goToDashboard}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
