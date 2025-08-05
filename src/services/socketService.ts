import { io, Socket } from 'socket.io-client';
import { FuelTransaction } from '../types/electron';

// Автоматическое определение Socket URL в зависимости от платформы
const getSocketUrl = () => {
  if (typeof window !== 'undefined' && window.location && window.location.protocol === 'https:') {
    return 'https://bunker-boats.ru';
  }
  return 'http://89.169.170.164:5000';
};

class SocketService {
  private static instance: SocketService;
  private socket: Socket;
  private isConnected: boolean = false;
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

  private constructor() {
    const socketUrl = getSocketUrl();
    console.log('🔌 Socket URL:', socketUrl);
    
    try {
      this.socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });
    } catch (error) {
      console.error('Ошибка создания Socket.IO:', error);
      // Создаем заглушку для предотвращения ошибок
      this.socket = {} as Socket;
      return;
    }

    this.socket.on('connect', () => {
      console.log('WebSocket подключен');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      // При переподключении переустанавливаем обработчики
      this.setupEventListeners();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Ошибка подключения WebSocket:', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket отключен:', reason);
      this.isConnected = false;
    });

    this.socket.on('error', (error: Error) => {
      console.error('WebSocket ошибка:', error);
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Удаляем старые обработчики
    this.socket.off('data-updated');
    this.socket.off('transaction:created');
    this.socket.off('transaction:updated');
    this.socket.off('transaction:deleted');

    this.socket.on('data-updated', (data: any) => {
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

    this.socket.on('transaction:created', (transaction: FuelTransaction) => {
      if (this.transactionCallbacks.created) {
        this.transactionCallbacks.created(transaction);
      }
    });

    this.socket.on('transaction:updated', (transaction: FuelTransaction) => {
      if (this.transactionCallbacks.updated) {
        this.transactionCallbacks.updated(transaction);
      }
    });

    this.socket.on('transaction:deleted', (transactionId: string) => {
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
        this.socket.connect();
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

  public connect() {
    if (!this.isConnected) {
      this.socket.connect();
    }
  }

  public disconnect() {
    if (this.isConnected) {
      this.socket.disconnect();
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
    this.socket.on('order:created', callback);
  }

  public onOrderUpdated(callback: (order: any) => void) {
    this.socket.on('order:updated', callback);
  }

  public onOrderDeleted(callback: (orderId: string) => void) {
    this.socket.on('order:deleted', callback);
  }

  public removeOrderListeners() {
    this.socket.off('order:created');
    this.socket.off('order:updated');
    this.socket.off('order:deleted');
  }
}

export default SocketService; 