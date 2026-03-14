import { RouteComponentProps } from '@reach/router';
import { Constants, Types } from '@tosios/common';
import { GameMode } from '@tosios/common/src/types';
import { RoomAvailable } from 'colyseus.js/lib/Room';
import qs from 'querystringify';
import React, { useEffect, useRef, useState } from 'react';
import { Box, Separator, Space, View } from '../../components';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { NameField } from './components/NameField';
import { NewGameField } from './components/NewGameField';
import { RoomsList } from './components/RoomsList';

interface HomeScreenProps extends RouteComponentProps {}

export function HomeScreen({ navigate }: HomeScreenProps) {
    const [rooms, setRooms] = useState<Array<RoomAvailable<any>>>([]);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    //
    // Lifecycle
    //
    useEffect(() => {
        try {
            intervalRef.current = setInterval(updateRooms, Constants.ROOM_REFRESH);

            updateRooms();
        } catch (error) {
            console.error(error);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    //
    // Utils
    //
    async function updateRooms() {
        try {
            const response = await fetch(`${window.location.origin}/api/games/rooms/${Constants.ROOM_NAME}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                },
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.error || `Could not fetch rooms (${response.status})`);
            }

            setRooms(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setRooms([]);
        }
    }

    //
    // Handlers
    //
    function handleRoomCreate(name: string, maxPlayers: number, map: string, mode: GameMode) {
        const playerName = localStorage.getItem('playerName') || '';

        const options: Types.RoomOptions = {
            playerName,
            roomName: name,
            roomMap: map,
            roomMaxPlayers: maxPlayers,
            mode,
        };

        navigate(`/new${qs.stringify(options, true)}`);
    }

    function handleRoomClick(roomId: string) {
        navigate(`/${roomId}`);
    }

    return (
        <View
            flex
            center
            style={{
                padding: 32,
                flexDirection: 'column',
            }}
        >
            <Header />
            <Space size="m" />
            <NameField />
            <Space size="m" />
            <Box
                style={{
                    width: 500,
                    maxWidth: '100%',
                }}
            >
                <NewGameField onCreate={handleRoomCreate} />
                <Space size="xxs" />
                <Separator />
                <Space size="xxs" />
                <RoomsList rooms={rooms} onRoomClick={handleRoomClick} />
                <Space size="xxs" />
            </Box>
            <Space size="m" />
            <Footer />
        </View>
    );
}
