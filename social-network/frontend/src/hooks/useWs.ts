import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { authenticateWebsocket } from '@/app/actions';

let sharedSocket: WebSocket | undefined;
function useWs() {
  const socketRef = useRef<WebSocket | undefined>(sharedSocket);
  const [message, setMessage] = useState<any>();
  const creatingSocketRef = useRef(false);
  const setNewMessage = (event: any) => {
    try {
      const eventJson = JSON.parse(event.data);
      eventJson.data = Math.random()
      console.log(eventJson)
      setMessage(eventJson);
      forceUpdate()
    } catch (e: any) {
      console.log(e)
    }
  }

  const [, forceUpdate] = useReducer(x => x + 1, 0);
  useEffect(() => {
    async function startWs() {
      creatingSocketRef.current = true;
      const json = await authenticateWebsocket();
      if (json) {
        const ws = new WebSocket('ws://localhost:8080/ws?token=' + json.body);
        ws.onerror = function () {
          console.log('error');
        };
        ws.onmessage = setNewMessage
        socketRef.current = ws;
        sharedSocket = socketRef.current;
      }
      creatingSocketRef.current = false;
    }
    if (!socketRef.current && !creatingSocketRef.current) {
      startWs().then();
    }
    const socketRefCurrent = socketRef;
    return () => {
      socketRefCurrent.current?.close();
    };
  }, []);
  const sendNewMessage = useCallback((newMessage: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(newMessage));
    }
  }, []);
  return { message, sendNewMessage };
}
