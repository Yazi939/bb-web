import { io, Socket } from 'socket.io-client';
import { FuelTransaction } from '../types/electron';

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 5000; // 5 seconds
  private dataUpdatedCallback: ((data: any) => void) | null = null;
  private transactionCallbacks: {
    created: ((transaction: FuelTransaction) => void) | null;
    updated: ((transaction: FuelTransaction) => void) | null;
    deleted: ((transactionId: string) => void) | null;
  } = {
    created: null,
    updated: null,
    deleted: null
  };
  private lastEventId: string | null = null;
  private listeners: { [key: string]: Function[] } = {};

  private constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Удаляем старые обработчики
    this.socket?.off('data-updated');
    this.socket?.off('transaction:created');
    this.socket?.off('transaction:updated');
    this.socket?.off('transaction:deleted');

    this.socket?.on('data-updated', (data: any) => {
      // Проверяем на дублирование событий
      if (data.id && data.id === this.lastEventId) {
        console.log('Пропускаем дублирующееся событие:', data.id);
        return;
      }
      this.lastEventId = data.id;
      
      console.log('Получено обновление данных:', data);
      if (this.dataUpdatedCallback) {
        this.dataUpdatedCallback(data);
      }
    });

    this.socket?.on('transaction:created', (transaction: FuelTransaction) => {
      if (this.transactionCallbacks.created) {
        this.transactionCallbacks.created(transaction);
      }
    });

    this.socket?.on('transaction:updated', (transaction: FuelTransaction) => {
      if (this.transactionCallbacks.updated) {
        this.transactionCallbacks.updated(transaction);
      }
    });

    this.socket?.on('transaction:deleted', (transactionId: string) => {
      if (this.transactionCallbacks.deleted) {
        this.transactionCallbacks.deleted(transactionId);
      }
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Попытка переподключения ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      setTimeout(() => {
        this.socket?.connect();
      }, this.reconnectTimeout);
    } else {
      console.error('Превышено максимальное количество попыток переподключения');
    }
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public connect(): void {
    if (this.socket) {
      return;
    }

    // Определяем URL для WebSocket подключения
    const getSocketUrl = () => {
      if (window.location.protocol === 'https:') {
        return 'https://bunker-boats.ru';
      }
      return 'http://89.169.170.164:5000';
    };

    const socketUrl = getSocketUrl();
    console.log('🔌 Socket URL:', socketUrl);

    try {
      this.socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        // При переподключении переустанавливаем обработчики
        this.setupEventListeners();
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('🔥 Socket connection error:', error);
      });

    } catch (error) {
      console.error('❌ Failed to initialize socket:', error);
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('🔌 Socket disconnected manually');
    }
  }

  public onDataUpdated(callback: (data: any) => void) {
    this.dataUpdatedCallback = callback;
  }

  public removeDataUpdatedListener() {
    this.dataUpdatedCallback = null;
  }

  public onTransactionCreated(callback: (transaction: FuelTransaction) => void) {
    this.transactionCallbacks.created = callback;
  }

  public onTransactionUpdated(callback: (transaction: FuelTransaction) => void) {
    this.transactionCallbacks.updated = callback;
  }

  public onTransactionDeleted(callback: (transactionId: string) => void) {
    this.transactionCallbacks.deleted = callback;
  }

  public removeTransactionListeners() {
    this.transactionCallbacks = {
      created: null,
      updated: null,
      deleted: null
    };
  }

  public onOrderCreated(callback: (order: any) => void) {
    this.socket?.on('order:created', callback);
  }

  public onOrderUpdated(callback: (order: any) => void) {
    this.socket?.on('order:updated', callback);
  }

  public onOrderDeleted(callback: (orderId: string) => void) {
    this.socket?.on('order:deleted', callback);
  }

  public removeOrderListeners() {
    this.socket?.off('order:created');
    this.socket?.off('order:updated');
    this.socket?.off('order:deleted');
  }

  public emit(event: string, data: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  public on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  public off(event: string, callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export default SocketService; 