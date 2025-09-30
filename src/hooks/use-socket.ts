"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "@/types/socket";
import { useAuth } from "@/@saas-boilerplate/features/auth/presentation/contexts/auth.context";
import { toast } from "sonner";

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>;

interface UseSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { autoConnect = true, onConnect, onDisconnect, onError } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const socketRef = useRef<SocketType | null>(null);
  const { session } = useAuth();

  const connect = () => {
    if (socketRef.current?.connected) {
      return socketRef.current;
    }

    setIsConnecting(true);

    const socket = io({
      path: "/socket.io/",
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: false,
    });

    socket.on("connect", () => {
      console.log("Socket.IO conectado:", socket.id);
      setIsConnected(true);
      setIsConnecting(false);
      onConnect?.();

      // Auto-join organization inbox if user is authenticated
      if (session?.organization?.id) {
        socket.emit("join_inbox", { organizationId: session.organization.id });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket.IO desconectado:", reason);
      setIsConnected(false);
      setIsConnecting(false);
      onDisconnect?.();
    });

    socket.on("connect_error", (error) => {
      console.error("Erro de conexão Socket.IO:", error);
      setIsConnecting(false);
      onError?.(error);
    });

    socketRef.current = socket;
    return socket;
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setIsConnecting(false);
    }
  };

  const emit = <T extends keyof ClientToServerEvents>(
    event: T,
    data: Parameters<ClientToServerEvents[T]>[0],
  ) => {
    if (socketRef.current?.connected) {
      (socketRef.current.emit as any)(event, data);
    } else {
      console.warn("Socket não conectado. Tentando reconectar...");
      connect()?.emit(event, data as Parameters<ClientToServerEvents[T]>[0]);
    }
  };

  const on = <T extends keyof ServerToClientEvents>(
    event: T,
    callback: ServerToClientEvents[T],
  ) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback as any);
    }
  };

  const off = <T extends keyof ServerToClientEvents>(
    event: T,
    callback?: ServerToClientEvents[T],
  ) => {
    if (socketRef.current) {
      if (callback) {
        socketRef.current.off(event, callback as any);
      } else {
        socketRef.current.off(event);
      }
    }
  };

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, []);

  // Reconnect when organization changes
  useEffect(() => {
    if (socketRef.current?.connected && session?.organization?.id) {
      socketRef.current.emit("join_inbox", {
        organizationId: session.organization.id,
      });
    }
  }, [session?.organization?.id]);

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    emit,
    on,
    off,
  };
}

// Hook específico para chat
export function useChatSocket() {
  const socket = useSocket({
    onConnect: () => {
      console.log("Chat Socket conectado");
    },
    onDisconnect: () => {
      console.log("Chat Socket desconectado");
    },
    onError: (error: any) => {
      toast.error("Erro de conexão com o chat");
      console.error("Chat Socket error:", error);
    },
  });

  const joinConversation = (conversationId: string) => {
    socket.emit("join_conversation", { conversationId });
  };

  const leaveConversation = (conversationId: string) => {
    socket.emit("leave_conversation", { conversationId });
  };

  const startTyping = (conversationId: string) => {
    socket.emit("typing_start", { conversationId });
  };

  const stopTyping = (conversationId: string) => {
    socket.emit("typing_stop", { conversationId });
  };

  return {
    ...socket,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
  };
}
