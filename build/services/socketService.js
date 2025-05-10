"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_client_1 = require("socket.io-client");
class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectTimeout = 5000; // 5 seconds
        this.dataUpdatedCallback = null;
        this.transactionCallbacks = {
            created: null,
            updated: null,
            deleted: null
        };
        this.lastEventId = null;
        this.connect('http://89.169.170.164:5000', {
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000,
            transports: ['polling', 'websocket'],
            withCredentials: true,
            autoConnect: true,
            forceNew: true,
            path: '/socket.io/'
        });
    }
    registerDefaultHandlers() {
        if (!this.socket)
            return;
        this.socket.on('connect', () => {
            console.log('Socket connected');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            // При переподключении переустанавливаем обработчики
            this.setupEventListeners();
        });
        this.socket.on('connect_error', (error) => {
            console.error('Socket connect error:', error);
        });
        this.socket.on('disconnect', (reason) => {
            console.warn('Socket disconnected:', reason);
            this.isConnected = false;
        });
    }
    setupEventListeners() {
        // Удаляем старые обработчики
        this.socket?.off('data-updated');
        this.socket?.off('transaction:created');
        this.socket?.off('transaction:updated');
        this.socket?.off('transaction:deleted');
        this.socket?.on('data-updated', (data) => {
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
        this.socket?.on('transaction:created', (transaction) => {
            if (this.transactionCallbacks.created) {
                this.transactionCallbacks.created(transaction);
            }
        });
        this.socket?.on('transaction:updated', (transaction) => {
            if (this.transactionCallbacks.updated) {
                this.transactionCallbacks.updated(transaction);
            }
        });
        this.socket?.on('transaction:deleted', (transactionId) => {
            if (this.transactionCallbacks.deleted) {
                this.transactionCallbacks.deleted(transactionId);
            }
        });
    }
    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Попытка переподключения ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            setTimeout(() => {
                this.socket?.connect();
            }, this.reconnectTimeout);
        }
        else {
            console.error('Превышено максимальное количество попыток переподключения');
        }
    }
    static getInstance() {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }
    connect(url, options) {
        this.socket = (0, socket_io_client_1.io)(url, options);
        this.registerDefaultHandlers();
    }
    disconnect() {
        this.socket?.disconnect();
        this.socket = null;
    }
    onDataUpdated(callback) {
        this.dataUpdatedCallback = callback;
    }
    removeDataUpdatedListener() {
        this.dataUpdatedCallback = null;
    }
    onTransactionCreated(callback) {
        this.transactionCallbacks.created = callback;
    }
    onTransactionUpdated(callback) {
        this.transactionCallbacks.updated = callback;
    }
    onTransactionDeleted(callback) {
        this.transactionCallbacks.deleted = callback;
    }
    removeTransactionListeners() {
        this.transactionCallbacks = {
            created: null,
            updated: null,
            deleted: null
        };
    }
    onOrderCreated(callback) {
        this.socket?.on('order:created', callback);
    }
    onOrderUpdated(callback) {
        this.socket?.on('order:updated', callback);
    }
    onOrderDeleted(callback) {
        this.socket?.on('order:deleted', callback);
    }
    removeOrderListeners() {
        this.socket?.off('order:created');
        this.socket?.off('order:updated');
        this.socket?.off('order:deleted');
    }
    on(event, handler) {
        this.socket?.on(event, handler);
    }
    emit(event, ...args) {
        this.socket?.emit(event, ...args);
    }
}
exports.default = SocketService;
