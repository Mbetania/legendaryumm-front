import { io } from "socket.io-client";
const BACKEND_URL = import.meta.env.VITE_APP_BACKEND_URL as string;
const socket = io("http://localhost:3000/");

export default socket;
