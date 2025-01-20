// app/game/[roomCode]/page.js
'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

let socket;

export default function GameRoom({ params, searchParams }) {
  const [gameState, setGameState] = useState('waiting'); // waiting, playing, results
  const [players, setPlayers] = useState([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [number, setNumber] = useState('');
  const [results, setResults] = useState(null);
  const [playerId, setPlayerId] = useState(null);

  useEffect(() => {
    socket = io('http://localhost:3001')

    // Connect to room
    if (params.roomCode) {
      if (searchParams.create) {
        socket.emit('createRoom', { 
          playerName: searchParams.name 
        });
      } else {
        socket.emit('joinRoom', { 
          roomCode: params.roomCode,
          playerName: searchParams.name
        });
      }
    }

    socket.on('roomCreated', ({ roomCode, playerId }) => {
      setPlayerId(playerId);
    });

    socket.on('joinedRoom', ({ playerId }) => {
      setPlayerId(playerId);
    });

    socket.on('playerJoined', ({ players }) => {
      setPlayers(players);
    });

    socket.on('gameStart', (roundInfo) => {
      setGameState('playing');
      setCurrentRound(roundInfo.round);
      startTimer(roundInfo.timeLimit);
    });

    socket.on('roundResults', (results) => {
      setGameState('results');
      setResults(results);
    });

    socket.on('roundStart', (roundInfo) => {
      setGameState('playing');
      setCurrentRound(roundInfo.round);
      setResults(null);
      setNumber('');
      startTimer(roundInfo.timeLimit);
    });

    socket.on('gameOver', ({ winner, finalScores }) => {
      setGameState('gameOver');
      setResults({ ...results, gameOver: true, winner });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const startTimer = (seconds) => {
    setTimeLeft(seconds);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const submitNumber = () => {
    if (!number || number < 0 || number > 100) return;
    socket.emit('submitNumber', {
      roomCode: params.roomCode,
      number: parseInt(number)
    });
    setNumber('');
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Room Code: {params.roomCode}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {gameState === 'waiting' && (
                <Alert>
                  <AlertTitle>Waiting for players</AlertTitle>
                  <AlertDescription>
                    {players.length}/5 players have joined
                  </AlertDescription>
                </Alert>
              )}

              {gameState === 'playing' && (
                <>
                  <Alert>
                    <AlertTitle>Round {currentRound}</AlertTitle>
                    <AlertDescription>
                      Time remaining: {timeLeft} seconds
                    </AlertDescription>
                  </Alert>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Enter your number (0-100)"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                    />
                    <Button onClick={submitNumber}>Submit</Button>
                  </div>
                </>
              )}

              {results && (
                <Card>
                  <CardHeader>
                  <CardTitle>Round {currentRound} Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">Average:</p>
                          <p className="text-2xl">{results.average.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Target (80%):</p>
                          <p className="text-2xl">{results.target.toFixed(2)}</p>
                        </div>
                      </div>

                      {results.duplicates.length > 0 && (
                        <Alert variant="destructive">
                          <AlertTitle>Duplicate Numbers Found</AlertTitle>
                          <AlertDescription>
                            Numbers {results.duplicates.join(', ')} are invalid!
                          </AlertDescription>
                        </Alert>
                      )}

                      {results.winner && (
                        <Alert variant="success">
                          <AlertTitle>Round Winner</AlertTitle>
                          <AlertDescription>
                            {results.winner.name} wins with number {results.numbers[results.winner.id]}!
                          </AlertDescription>
                        </Alert>
                      )}

                      {results.eliminations.length > 0 && (
                        <Alert variant="destructive">
                          <AlertTitle>Player Eliminated!</AlertTitle>
                          <AlertDescription>
                            {results.eliminations.map(player => (
                              <div key={player.id}>
                                {player.name} has been eliminated! (Aqua Regia released)
                              </div>
                            ))}
                          </AlertDescription>
                        </Alert>
                      )}

                      {results.gameOver && (
                        <Alert>
                          <AlertTitle>Game Over!</AlertTitle>
                          <AlertDescription>
                            {results.winner.name} has won the Death Game!
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Players</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Points</TableHead>
                        {results && (
                          <TableHead>Number Chosen</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {players.map((player) => (
                        <TableRow key={player.id}>
                          <TableCell>
                            {player.name}
                            {player.id === playerId && " (You)"}
                          </TableCell>
                          <TableCell>
                            {player.isAlive ? (
                              <span className="text-green-500">Alive</span>
                            ) : (
                              <span className="text-red-500">Eliminated</span>
                            )}
                          </TableCell>
                          <TableCell>{player.points}</TableCell>
                          {results && (
                            <TableCell>
                              {results.numbers[player.id]}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {gameState === 'results' && !results.gameOver && (
                <Alert>
                  <AlertTitle>Next Round</AlertTitle>
                  <AlertDescription>
                    Next round starting in 10 seconds...
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Game Rules Card */}
        <Card>
          <CardHeader>
            <CardTitle>Game Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-medium">Basic Rules:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Choose a number between 0 and 100</li>
                  <li>Target is 80% of the average of all numbers</li>
                  <li>Closest number wins the round</li>
                  <li>Losers lose 1 point</li>
                  <li>Game Over at -10 points</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium">Special Rules:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>4 players: Duplicate numbers become invalid</li>
                  <li>3 players: Double penalty for exact matches</li>
                  <li>2 players: If one picks 0 and other 100, 100 wins</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}