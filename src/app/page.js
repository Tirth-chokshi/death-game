// app/page.js
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const createGame = async () => {
    if (!playerName) return;
    router.push(`/game/create?name=${encodeURIComponent(playerName)}`);
  };

  const joinGame = async () => {
    if (!playerName || !roomCode) return;
    router.push(`/game/join?code=${roomCode}&name=${encodeURIComponent(playerName)}`);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Death Game</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Button 
              className="w-full" 
              onClick={createGame}
            >
              Create New Game
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or join existing game
                </span>
              </div>
            </div>
            <Input
              placeholder="Enter room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
            />
            <Button 
              className="w-full" 
              variant="outline"
              onClick={joinGame}
            >
              Join Game
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}