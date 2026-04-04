import { Constants, Models } from '../../../../common/src';
import { Client, Room } from 'colyseus.js';
import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { View } from '../../components';
import { Game } from '../../game/Game';
import { HUD } from './components/HUD/HUD';
import { HUDProps } from './components/HUD';
import { JoySticks, JoystickDirections } from './components/JoySticks';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

async function fetchAuthenticatedUserId() {
    try {
        const response = await fetch(`${BACKEND_URL}/auth/me`, {
            credentials: 'include'
        });

        if (!response.ok) return '';

        const data = await response.json();
        return data?.user?.id || '';
    } catch {
        return '';
    }
}

const isMobile = window.matchMedia("(max-width: 768px)").matches;

export function GameScreen() {
    const navigate = useNavigate();
    const location = useLocation();
    const { roomId } = useParams<{ roomId: string }>();

    const startedRef = useRef(false);

    const [hud, setHUD] = useState<HUDProps>({
        gameMode: '',
        gameMap: '',
        gameModeEndsAt: 0,
        roomName: '',
        playerId: '',
        playerName: '',
        playerLives: 0,
        playerMaxLives: 0,
        players: [],
        playersCount: 0,
        playersMaxCount: 0,
        messages: [],
        announce: '',
    });

    const canvasRef = useRef<HTMLDivElement | null>(null);
    const clientRef = useRef<Client | null>(null);
    const gameRef = useRef<Game | null>(null);
    const roomRef = useRef<Room | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        // 1. Stop React Strict Mode from double-booting the game!
        if (startedRef.current) return;
        startedRef.current = true;

        start();
        
        return () => {
            stop();
            // 2. Nuke the old canvas from the HTML so they don't stack
            if (canvasRef.current) {
                canvasRef.current.innerHTML = '';
            }
        };
    }, [roomId]);

    async function start() {
        if (!roomId) return;

        const isNewRoom = roomId === 'new';
        const userId = await fetchAuthenticatedUserId();

        gameRef.current = new Game(
            window.innerWidth,
            window.innerHeight,
            handleActionSend
        );

        const params = new URLSearchParams(location.search);

        let options: any;

        if (isNewRoom) {
            options = {
                playerName: params.get("playerName") || "Player",
                roomName: params.get("roomName") || "Room",
                roomMap: params.get("roomMap") || "small",
                roomMaxPlayers: Number(params.get("roomMaxPlayers") || 2),
                mode: params.get("mode") || "deathmatch",
                userId,
            };
        } else {
            options = {
                playerName: localStorage.getItem("playerName") || "Player",
                userId,
            };
        }

        try {
            //@ts-ignore
            const url = import.meta.env.DEV 
                ? "ws://localhost:3000" 
                : `${window.location.protocol.replace('http', 'ws')}//${window.location.host}`;

            clientRef.current = new Client(url);

            if (isNewRoom) {
                roomRef.current = await clientRef.current.create(
                    "campusFighter", 
                    options
                );

                // redirect to actual room ID
                window.history.replaceState(
                    null,
                    '',
                    `/campusFighter/${roomRef.current.roomId}`
                );
            } else {
                roomRef.current = await clientRef.current.joinById(
                    roomId,
                    options
                );
            }
        } catch (err) {
            console.error("JOIN ERROR:", err);
            navigate('/campusFighter/new');
            return;
        }

        const playerId = roomRef.current.sessionId;

        setHUD(prev => ({
            ...prev,
            playerId
        }));

        // ---- STATE LISTENERS ----
        
        // 1. GAME LISTENERS (This brings the timer back online!)
        const gameState = roomRef.current.state.game;
        gameState.listen("state", (val: any) => gameRef.current?.gameUpdate("state", val));
        gameState.listen("roomName", (val: any) => gameRef.current?.gameUpdate("roomName", val));
        gameState.listen("mapName", (val: any) => gameRef.current?.gameUpdate("mapName", val));
        gameState.listen("maxPlayers", (val: any) => gameRef.current?.gameUpdate("maxPlayers", val));
        gameState.listen("lobbyEndsAt", (val: any) => gameRef.current?.gameUpdate("lobbyEndsAt", val));
        gameState.listen("gameEndsAt", (val: any) => gameRef.current?.gameUpdate("gameEndsAt", val));
        gameState.listen("mode", (val: any) => gameRef.current?.gameUpdate("mode", val));

        // 2. PLAYER LISTENERS (Atomic sync to fix the teleport race condition!)
        roomRef.current.state.players.onAdd((player: any, id: string) => {
            gameRef.current?.playerAdd(id, player, isPlayerIdMe(id));
            updateRoom();

            // FIX: Use onChange so the math only runs ONCE after x, y, ack, and color have ALL arrived!
            player.onChange(() => {
                gameRef.current?.playerUpdate(id, player, isPlayerIdMe(id));
            });
        });

        roomRef.current.state.players.onRemove((player: any, id: string) => {
            gameRef.current?.playerRemove(id, isPlayerIdMe(id));
            updateRoom();
        });
        
        // 3. MONSTER LISTENERS (Atomic sync to unfreeze them!)
        roomRef.current.state.monsters.onAdd((m: any, id: string) => {
            gameRef.current?.monsterAdd(id, m);
            m.onChange(() => {
                gameRef.current?.monsterUpdate(id, m);
            });
        });

        roomRef.current.state.monsters.onRemove((m: any, id: string) => {
            gameRef.current?.monsterRemove(id);
        });
        
        // 4. PROP/POTION LISTENERS (Atomic sync!)
        roomRef.current.state.props.onAdd((p: any, id: string) => {
            gameRef.current?.propAdd(id, p);
            p.onChange(() => {
                gameRef.current?.propUpdate(id, p);
            });
        });

        roomRef.current.state.props.onRemove((p: any, id: string) => {
            gameRef.current?.propRemove(id);
        });
        
        // 5. BULLET LISTENERS (This makes other players' bullets visible!)
        roomRef.current.state.bullets.onAdd((b: any, id: string) => {
            gameRef.current?.bulletAdd(id, b);
            
            // The server reuses bullets to save memory. Listen to when they are fired again!
            b.listen("active", (isActive: boolean) => {
                if (isActive) {
                    gameRef.current?.bulletAdd(id, b);
                } else {
                    gameRef.current?.bulletRemove(id);
                }
            });
            b.listen("shotAt", () => {
                if (b.active) gameRef.current?.bulletAdd(id, b);
            });
        });

        roomRef.current.state.bullets.onRemove((b: any, id: string) => {
            gameRef.current?.bulletRemove(id);
        });

        roomRef.current.onMessage('*', handleMessage);

        gameRef.current.start(canvasRef.current!);

        window.addEventListener('resize', handleWindowResize);

        intervalRef.current = setInterval(updateRoom, Constants.PLAYERS_REFRESH);
    }

    function stop() {
        roomRef.current?.leave();
        gameRef.current?.stop();

        window.removeEventListener('resize', handleWindowResize);

        if (intervalRef.current) clearInterval(intervalRef.current);
    }

    function updateRoom() {
        const stats = gameRef.current?.getStats();
        if (!stats) return;

        setHUD(prev => ({
            ...prev,
            ...stats
        }));
    }

    function isPlayerIdMe(playerId: string) {
        return playerId === roomRef.current?.sessionId;
    }

    // ---- HANDLERS ----
    function handlePlayerAdd(player: any, id: string) {
        gameRef.current?.playerAdd(id, player, isPlayerIdMe(id));
        updateRoom();
        
        player.onChange(() => handlePlayerUpdate(player, id));
    }

    function handlePlayerUpdate(player: any, id: string) {
        gameRef.current?.playerUpdate(id, player, isPlayerIdMe(id));
    }

    function handlePlayerRemove(_: any, id: string) {
        gameRef.current?.playerRemove(id, isPlayerIdMe(id));
        updateRoom();
    }

    function handleMonsterAdd(m: any, id: string) {
        gameRef.current?.monsterAdd(id, m);
        m.onChange(() => handleMonsterUpdate(m, id));
    }

    function handleMonsterUpdate(m: any, id: string) {
        gameRef.current?.monsterUpdate(id, m);
    }

    function handleMonsterRemove(_: any, id: string) {
        gameRef.current?.monsterRemove(id);
    }

    function handlePropAdd(p: any, id: string) {
        gameRef.current?.propAdd(id, p);
        p.onChange(() => handlePropUpdate(p, id));
    }

    function handlePropUpdate(p: any, id: string) {
        gameRef.current?.propUpdate(id, p);
    }

    function handlePropRemove(_: any, id: string) {
        gameRef.current?.propRemove(id);
    }

    function handleBulletAdd(b: any, id: string) {
        gameRef.current?.bulletAdd(id, b);
    }

    function handleBulletRemove(_: any, id: string) {
        gameRef.current?.bulletRemove(id);
    }

    function handleMessage(type: any, message: Models.MessageJSON) {
        //@ts-ignore
        let announce;

        switch (type) {
            case 'waiting': announce = "Waiting..."; break;
            case 'start': announce = "Game starts"; break;
            case 'won': announce = `${message.params.name} wins!`; break;
        }

        setHUD(prev => ({
            ...prev,
            messages: [...prev.messages, message].slice(-Constants.LOG_LINES_MAX),
            //@ts-ignore
            announce
        }));
    }

    function handleActionSend(action: Models.ActionJSON) {
        console.log("SENDING ACTION:", action);
        roomRef.current?.send(action.type, action);
    }

    function handleWindowResize() {
        gameRef.current?.setScreenSize(window.innerWidth, window.innerHeight);
    }

    return (
        <View style={{ position: 'relative', height: '100%' }}>
            <Helmet>
                <title>{hud.roomName || "Game"}</title>
            </Helmet>

            <div ref={canvasRef} />

            {isMobile && (
                <JoySticks
                    onLeftMove={() => {}}
                    onLeftRelease={() => {}}
                    onRightMove={() => {}}
                    onRightRelease={() => {}}
                />
            )}

            <HUD {...hud} />
        </View>
    );
}