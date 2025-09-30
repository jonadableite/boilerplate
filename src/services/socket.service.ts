import { Server as SocketIOServer } from "socket.io";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from "../types/socket";

export class SocketService {
  private static instance: SocketService;
  private io: SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  > | null = null;

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  setIO(
    io: SocketIOServer<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >,
  ) {
    this.io = io;
  }

  getIO() {
    return this.io;
  }

  // Emit new message to conversation participants
  emitNewMessage(
    conversationId: string,
    message: {
      id: string;
      content: string;
      fromMe: boolean;
      createdAt: string;
      contentType: string;
    },
  ) {
    if (!this.io) {
      console.warn("Socket.IO not initialized");
      return;
    }

    this.io.to(`conversation:${conversationId}`).emit("message:received", {
      conversationId,
      message,
    });

    console.log(`Emitted new message to conversation:${conversationId}`);
  }

  // Emit conversation update to organization inbox
  emitConversationUpdate(
    organizationId: string,
    conversationId: string,
    data: {
      lastMessage?: {
        id: string;
        content: string;
        fromMe: boolean;
        createdAt: string;
      };
      unreadCount?: number;
    },
  ) {
    if (!this.io) {
      console.warn("Socket.IO not initialized");
      return;
    }

    this.io.to(`inbox:${organizationId}`).emit("conversation:updated", {
      conversationId,
      ...data,
    });

    console.log(`Emitted conversation update to inbox:${organizationId}`);
  }

  // Emit contact update
  emitContactUpdate(
    organizationId: string,
    contactId: string,
    data: {
      name?: string;
      lastSeen?: string;
    },
  ) {
    if (!this.io) {
      console.warn("Socket.IO not initialized");
      return;
    }

    this.io.to(`inbox:${organizationId}`).emit("contact:updated", {
      contactId,
      ...data,
    });

    console.log(`Emitted contact update to inbox:${organizationId}`);
  }

  // Emit WhatsApp instance status update
  emitWhatsAppStatus(
    organizationId: string,
    instanceId: string,
    status: string,
    qrCode?: string,
  ) {
    if (!this.io) {
      console.warn("Socket.IO not initialized");
      return;
    }

    this.io.to(`inbox:${organizationId}`).emit("whatsapp:status", {
      instanceId,
      status,
      qrCode,
    });

    console.log(`Emitted WhatsApp status update to inbox:${organizationId}`);
  }

  // Get connected clients count for a room
  getConnectedClientsCount(room: string): Promise<number> {
    if (!this.io) {
      return Promise.resolve(0);
    }

    return new Promise((resolve) => {
      this.io!.in(room)
        .allSockets()
        .then((sockets) => {
          resolve(sockets.size);
        });
    });
  }

  // Check if Socket.IO is available
  isAvailable(): boolean {
    return this.io !== null;
  }
}

// Export singleton instance
export const socketService = SocketService.getInstance();
