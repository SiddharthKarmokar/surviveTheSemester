import { RouteComponentProps } from '@reach/router';
import { Constants, Models, Types } from '@tosios/common';
import { Client, Room } from 'colyseus.js';
import qs from 'querystringify';
import React, { useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { Helmet } from 'react-helmet';
import { View } from '../../components';
import { Game } from '../../game/Game';
import { FighterRoomState } from '../../schema/FighterRoomState';
import { HUDProps } from './components/HUD';
import { HUD } from './components/HUD/HUD';
import { JoystickDirections, JoySticks } from './components/JoySticks';

interface GameScreenProps
    extends RouteComponentProps<{
        roomId: string;
    }> {}

export function GameScreen({ navigate, location, roomId }: GameScreenProps) {
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

    const canvasRef = useRef<HTMLDivElement>();
    const clientRef = useRef<Client>();
    const gameRef = useRef<Game>();
    const roomRef = useRef<Room>();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const expectedMaxPlayersRef = useRef<number>(0);

    //
    // Lifecycle
    //
    useEffect(() => {
        start();

        return () => {
            stop();
        };
    }, []);

    //
    // Methods
    //
    async function start() {
        gameRef.current = new Game(window.innerWidth, window.innerHeight, handleActionSend);

        const { search = '' } = location || {};

        const isNewRoom = roomId === 'new';
        const parsedSearch = qs.parse(search) as Types.RoomOptions;

        let options;
        if (isNewRoom) {
            options = {
                ...parsedSearch,
                roomMaxPlayers: Number(parsedSearch.roomMaxPlayers),
            };
            expectedMaxPlayersRef.current = Number(parsedSearch.roomMaxPlayers) || Constants.ROOM_PLAYERS_MIN;
        } else {
            // The only thing to pass when joining an existing room is a player's name
            options = {
                playerName: localStorage.getItem('playerName'),
            };
            expectedMaxPlayersRef.current = Constants.ROOM_PLAYERS_MIN;
        }

        // Connect
        try {
            const host = window.document.location.host.replace(/:.*/, '');
            const port = process.env.NODE_ENV !== 'production' ? Constants.WS_PORT : window.location.port;
            const url = `${window.location.protocol.replace('http', 'ws')}//${host}${port ? `:${port}` : ''}`;

            clientRef.current = new Client(url);
            if (isNewRoom) {
                roomRef.current = await clientRef.current.create(Constants.ROOM_NAME, options, FighterRoomState as any);

                // We replace the "new" in the URL with the room's id
                window.history.replaceState(null, '', `/${roomRef.current.id}`);
            } else {
                roomRef.current = await clientRef.current.joinById(roomId, options, FighterRoomState as any);
            }
        } catch (error) {
            navigate('/');
            return;
        }

        // Set the current player id
        const playerId = roomRef.current.sessionId;
        setHUD((prev) => ({
            ...prev,
            playerId,
            // You are already in the room once connection succeeds.
            playersCount: Math.max(prev.playersCount, 1),
            playersMaxCount:
                Number((roomRef.current as any)?.state?.game?.maxPlayers) ||
                expectedMaxPlayersRef.current ||
                Constants.ROOM_PLAYERS_MIN,
        }));

        // Listen for state changes
        roomRef.current.state.game.onChange = handleGameChange;
        roomRef.current.state.players.onAdd = handlePlayerAdd;
        roomRef.current.state.players.onRemove = handlePlayerRemove;
        roomRef.current.state.monsters.onAdd = handleMonsterAdd;
        roomRef.current.state.monsters.onRemove = handleMonsterRemove;
        roomRef.current.state.props.onAdd = handlePropAdd;
        roomRef.current.state.props.onRemove = handlePropRemove;
        roomRef.current.state.bullets.onAdd = handleBulletAdd;
        roomRef.current.state.bullets.onRemove = handleBulletRemove;

        // Hydrate the current snapshot immediately.
        // Colyseus listeners only guarantee future changes; the initial state may already exist.
        const currentState: any = roomRef.current.state;
        const currentGame = currentState?.game;
        if (currentGame) {
            [
                ['roomName', currentGame.roomName],
                ['mapName', currentGame.mapName],
                ['state', currentGame.state],
                ['maxPlayers', currentGame.maxPlayers],
                ['lobbyEndsAt', currentGame.lobbyEndsAt],
                ['gameEndsAt', currentGame.gameEndsAt],
                ['mode', currentGame.mode],
            ].forEach(([field, value]) => {
                if (typeof value !== 'undefined') {
                    gameRef.current.gameUpdate(field as string, value);
                }
            });
        }

        const currentPlayers = currentState?.players;
        if (typeof currentPlayers?.forEach === 'function') {
            currentPlayers.forEach((player: any, playerId: string) => {
                handlePlayerAdd(player, playerId);
            });
        }

        // Listen for Messages
        roomRef.current.onMessage('*', handleMessage);

        // Start game
        gameRef.current.start(canvasRef.current);

        // Hydrate HUD immediately from authoritative room state.
        // This avoids showing 0/0 right after room creation before all change callbacks settle.
        updateRoom();

        // Listen for inputs
        window.addEventListener('resize', handleWindowResize);

        // Start players refresh listeners
        intervalRef.current = setInterval(updateRoom, Constants.PLAYERS_REFRESH);
    }

    async function stop() {
        // Colyseus
        if (roomRef.current) {
            roomRef.current.leave();
        }

        // Game
        gameRef.current.stop();

        // Inputs
        window.removeEventListener('resize', handleWindowResize);

        // Start players refresh listeners
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
    }

    //
    // Utils
    //
    function isPlayerIdMe(playerId: string) {
        return playerId === roomRef.current?.sessionId;
    }

    function updateRoom() {
        const stats = gameRef.current.getStats();

        const roomState: any = roomRef.current?.state;
        const statePlayers = roomState?.players;
        const stateGame = roomState?.game;

        let statePlayersCount = 0;
        if (typeof statePlayers?.size === 'number') {
            statePlayersCount = statePlayers.size;
        } else if (typeof statePlayers?.length === 'number') {
            statePlayersCount = statePlayers.length;
        } else if (typeof statePlayers?.entries === 'function') {
            for (const _entry of statePlayers.entries()) {
                statePlayersCount += 1;
            }
        } else if (statePlayers?.forEach) {
            statePlayers.forEach(() => {
                statePlayersCount += 1;
            });
        } else if (statePlayers?.$items && typeof statePlayers.$items === 'object') {
            statePlayersCount = Object.keys(statePlayers.$items).length;
        } else if (statePlayers && typeof statePlayers === 'object') {
            statePlayersCount = Object.keys(statePlayers).length;
        }

        const fallbackMaxPlayers =
            Number(stateGame?.maxPlayers) || expectedMaxPlayersRef.current || Constants.ROOM_PLAYERS_MIN;

        const playersCount = stats.playersCount || statePlayersCount;
        const playersMaxCount = stats.playersMaxCount || fallbackMaxPlayers;

        setHUD((prev) => ({
            ...prev,
            ...stats,
            playersCount,
            playersMaxCount,
        }));
    }

    //
    // Handlers
    //

    // Colyseus
    function handleGameChange(attributes: any) {
        for (const row of attributes) {
            gameRef.current.gameUpdate(row.field, row.value);
        }
    }

    function handlePlayerAdd(player: any, playerId: string) {
        const isMe = isPlayerIdMe(playerId);
        gameRef.current.playerAdd(playerId, player, isMe);
        updateRoom();

        player.onChange = () => {
            handlePlayerUpdate(player, playerId);
        };
    }

    function handlePlayerUpdate(player: any, playerId: string) {
        const isMe = isPlayerIdMe(playerId);
        gameRef.current.playerUpdate(playerId, player, isMe);
    }

    function handlePlayerRemove(player: Models.PlayerJSON, playerId: string) {
        const isMe = isPlayerIdMe(playerId);
        gameRef.current.playerRemove(playerId, isMe);
        updateRoom();
    }

    function handleMonsterAdd(monster: any, monsterId: string) {
        gameRef.current.monsterAdd(monsterId, monster);

        monster.onChange = () => {
            handleMonsterUpdate(monster, monsterId);
        };
    }

    function handleMonsterUpdate(monster: Models.MonsterJSON, monsterId: string) {
        gameRef.current.monsterUpdate(monsterId, monster);
    }

    function handleMonsterRemove(monster: Models.MonsterJSON, monsterId: string) {
        gameRef.current.monsterRemove(monsterId);
    }

    function handlePropAdd(prop: any, propId: string) {
        gameRef.current.propAdd(propId, prop);
        prop.onChange = () => {
            handlePropUpdate(prop, propId);
        };
    }

    function handlePropUpdate(prop: Models.PropJSON, propId: string) {
        gameRef.current.propUpdate(propId, prop);
    }

    function handlePropRemove(prop: Models.PropJSON, propId: string) {
        gameRef.current.propRemove(propId);
    }

    function handleBulletAdd(bullet: Models.BulletJSON, bulletId: string) {
        gameRef.current.bulletAdd(bulletId, bullet);
    }

    function handleBulletRemove(bullet: Models.BulletJSON, bulletId: string) {
        gameRef.current.bulletRemove(bulletId);
    }

    function handleMessage(type: any, message: Models.MessageJSON) {
        const { messages } = hud;

        if (type === 'playersStatus') {
            const nextCount = Number((message as any)?.count) || 0;
            const nextMaxCount = Number((message as any)?.maxCount) || hud.playersMaxCount;

            setHUD((prev) => ({
                ...prev,
                playersCount: nextCount,
                playersMaxCount: nextMaxCount,
            }));

            return;
        }

        if (type === 'joined') {
            setHUD((prev) => ({
                ...prev,
                playersCount: Math.min(
                    (prev.playersCount || 1) + 1,
                    prev.playersMaxCount || expectedMaxPlayersRef.current || Constants.ROOM_PLAYERS_MIN,
                ),
            }));
        }

        if (type === 'left') {
            setHUD((prev) => ({
                ...prev,
                playersCount: Math.max(1, (prev.playersCount || 1) - 1),
            }));
        }

        let announce: string | undefined;
        switch (type) {
            case 'waiting':
                announce = `Waiting for other players...`;
                break;
            case 'start':
                announce = `Game starts`;
                break;
            case 'won':
                announce = `${message.params.name} wins!`;
                break;
            case 'timeout':
                announce = `Timeout...`;
                break;
            default:
                break;
        }

        setHUD((prev) => ({
            ...prev,
            // Only set the last n messages (negative value on slice() is reverse)
            messages: [...messages, message].slice(-Constants.LOG_LINES_MAX),
            announce,
        }));

        updateRoom();
    }

    // GameManager
    function handleActionSend(action: Models.ActionJSON) {
        if (!roomRef.current) {
            return;
        }

        roomRef.current.send(action.type, action);
    }

    // Listeners
    function handleWindowResize() {
        gameRef.current.setScreenSize(window.innerWidth, window.innerHeight);
    }

    function handleJoyStickLeftMove(directions: JoystickDirections) {
        gameRef.current.inputs.up = directions.up;
        gameRef.current.inputs.right = directions.right;
        gameRef.current.inputs.down = directions.down;
        gameRef.current.inputs.left = directions.left;
    }

    function handleJoyStickLeftRelease() {
        gameRef.current.inputs.up = false;
        gameRef.current.inputs.right = false;
        gameRef.current.inputs.down = false;
        gameRef.current.inputs.left = false;
    }

    function handleJoyStickRightMove(rotation: number) {
        gameRef.current.forcedRotation = rotation;
        gameRef.current.inputs.shoot = true;
    }

    function handleJoyStickRightRelease() {
        gameRef.current.forcedRotation = null;
        gameRef.current.inputs.shoot = false;
    }

    return (
        <View
            style={{
                position: 'relative',
                height: '100%',
            }}
        >
            {/* Set page's title */}
            <Helmet>
                <title>{`${hud.roomName || hud.gameMode} [${hud.playersCount}]`}</title>
            </Helmet>

            {/* Where PIXI is injected */}
            <div ref={canvasRef} />

            {/* Joysticks */}
            {isMobile && (
                <JoySticks
                    onLeftMove={handleJoyStickLeftMove}
                    onLeftRelease={handleJoyStickLeftRelease}
                    onRightMove={handleJoyStickRightMove}
                    onRightRelease={handleJoyStickRightRelease}
                />
            )}

            {/* HUD: GUI, menu, leaderboard */}
            <HUD
                playerId={hud.playerId}
                gameMode={hud.gameMode}
                gameMap={hud.gameMap}
                gameModeEndsAt={hud.gameModeEndsAt}
                roomName={hud.roomName}
                playerName={hud.playerName}
                playerLives={hud.playerLives}
                playerMaxLives={hud.playerMaxLives}
                players={hud.players}
                playersCount={hud.playersCount}
                playersMaxCount={hud.playersMaxCount}
                messages={hud.messages}
                announce={hud.announce}
            />
        </View>
    );
}
