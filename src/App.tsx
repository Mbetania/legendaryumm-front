import { useEffect, useState } from "react";

import socket from "./socket";
import { v4 as uuidv4 } from "uuid";

export interface Position {
  x: number;
  y: number;
  z: number;
}

interface Player {
  id: string;
  position: Position;
  playerType: number;
}

interface Coin {
  id: string;
  position: Position;
}

function Game() {
  const [clients, setClients] = useState<string[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const [clientId, setClientId] = useState("");
  const [coins, setCoins] = useState<Coin[]>([]);
  const [coinIdToGrab, setCoinIdToGrab] = useState("");
  const [position, setPosition] = useState<Position>({ x: 0, y: 0, z: 0 });

  const handleGrabCoin = () => {
    socket.emit("grab coin", { coinId: coinIdToGrab, clientId, roomId });
    setCoinIdToGrab("");
  };

  useEffect(() => {
    const savedClientId = localStorage.getItem("clientId");
    if (savedClientId) {
      console.log("Client ID recovered from localStorage:", savedClientId);
      setClientId(savedClientId);
    } else {
      const newClientId = uuidv4();
      console.log("Generated client ID:", newClientId);
      localStorage.setItem("clientId", newClientId);
      setClientId(newClientId);
    }
  }, []);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server");
      console.log("Sending authenticate event with client ID:", clientId);
      socket.emit("authenticate", { clientId });

      socket.on("player joined", (newPlayer) => {
        setPlayers((players) => [...players, newPlayer]);
        setClients((clients) => [...clients, newPlayer.id]);
      });

      socket.on("authenticated", (data) => {
        console.log("Received authenticated event with data:", data);
        console.log("Authenticated:", data);
      });

      socket.on("new player", (newPlayer: Player) => {
        setPlayers((players: Player[]) => [...players, newPlayer]);
      });

      socket.on("room created", (data) => {
        console.log(data.id, "aca");
        const { id } = data;
        navigator.clipboard.writeText(id);
        setRoomId(id);

        setTimeout(() => {
          socket.emit("join room", { roomId: id, clientId });
        }, 1000);  // Wait for 1 second
      });

      socket.on("coins generated", (data) => {
        setCoins(data.coins);
      });

      socket.on("coin grabbed", (grabbedCoinId) => {
        setCoins((coins) => coins.filter((c) => c.id !== grabbedCoinId));
      });

      socket.on("player left", (leftPlayerId) => {
        setPlayers((players) => players.filter((p) => p.id !== leftPlayerId));
        setClients((clients) => clients.filter((c) => c !== leftPlayerId));
      });

      socket.on("update positions", (playersPositions) => {
        const newPlayers = [...players];
        for (let i = 0; i < newPlayers.length; i++) {
          const playerId = newPlayers[i].id;
          if (playersPositions[playerId]) {
            newPlayers[i].position = playersPositions[playerId];
          }
        }
        setPlayers(newPlayers);
      });

      socket.on("joined room", (data) => {
        console.log(data);
        console.log("Joined room with data:", data);
        console.log("Current client ID:", clientId);
        setJoined(true);
      });

      return () => {
        socket.off("connect");
        socket.off("authenticated");
        socket.off("new player");
        socket.off("room created");
        socket.off("coins generated");
        socket.off("coin grabbed");
        socket.off("player left");
        socket.off("update positions");
        socket.off("joined room");
      };
    });
  }, [clientId]);

  useEffect(() => {
    if (joined) {
      socket.emit("join room", {
        roomId,
        clientId,
        player: { ...position, id: clientId },
      });
    }
  }, [joined, roomId, clientId, position]);

  useEffect(() => {
    if(clientId !== "" && !(position.x === 0 && position.y === 0 && position.z === 0)) {
      socket.emit("update position", { clientId, position });
    }
  }, [position, clientId]);

  const handleCreateRoom = () => {
    socket.emit("create room", {
      name: "testroom",
      password: "testpassword",
    });
  };

  const handleJoinRoom = () => {
    socket.emit("join room", {
      roomId,
      clientId,
      player: { ...position, id: clientId },
    });
  };

  return (
    <div id="canvas-container">
      {!joined && (
        <div>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter Room ID"
          />
          <button onClick={handleCreateRoom}>Create Room</button>
          <button onClick={handleJoinRoom}>Join Room</button>
        </div>
      )}
      <div>
      <h2>Clients:</h2>
      {clients.map((clientId, index) => (
        <div key={clientId}>
          <div>Client {index+1}</div>
          <div>ID: {clientId}</div>
        </div>
      ))}
      </div>
      {players.map((player) => (
        <div key={player.id}>
          <h2>Player {player.id}</h2>
          <p>Position: {JSON.stringify(player.position)}</p>
        </div>
      ))}

      {coins.map((coin) => (
        <div key={coin.id}>
          <h2>Coin {coin.id}</h2>
          <p>Position: {JSON.stringify(coin.position)}</p>
        </div>
      ))}
      <div>
      <input
        type="text"
        value={coinIdToGrab}
        onChange={(e) => setCoinIdToGrab(e.target.value)}
        placeholder="Enter Coin ID to Grab"
      />
      <button onClick={handleGrabCoin}>Grab Coin</button>
    </div>
    </div>
  );
}

export default Game;
