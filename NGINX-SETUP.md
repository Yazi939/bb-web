# Настройка Nginx для HTTPS API

## 📋 Инструкция по настройке SSL для API

Теперь веб-приложение поддерживает HTTPS API через Nginx reverse proxy. Вот пошаговая инструкция для настройки на сервере.

## 🔧 **Шаг 1: Проверка Nginx**

```bash
# Проверить статус Nginx
sudo systemctl status nginx

# Если не установлен, установить
sudo apt update
sudo apt install nginx
```

## 🔧 **Шаг 2: Создание конфигурации**

Создайте файл конфигурации:
```bash
sudo nano /etc/nginx/sites-available/bunker-api
```

Добавьте следующую конфигурацию:
```nginx
server {
    listen 443 ssl http2;
    server_name bunker-boats.ru;
    
    # SSL сертификаты (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/bunker-boats.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bunker-boats.ru/privkey.pem;
    
    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # CORS заголовки для всех ответов
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept, Origin, X-Requested-With' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    
    # Обработка preflight запросов
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept, Origin, X-Requested-With';
        add_header 'Access-Control-Max-Age' 1728000;
        add_header 'Content-Type' 'text/plain; charset=utf-8';
        add_header 'Content-Length' 0;
        return 204;
    }
    
    # Проксирование API запросов
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Дополнительные CORS заголовки для API
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept, Origin, X-Requested-With' always;
    }
    
    # WebSocket поддержка для Socket.IO
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Основной сайт (если нужно)
    location / {
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ =404;
    }
    
    # Логи
    access_log /var/log/nginx/bunker-api-access.log;
    error_log /var/log/nginx/bunker-api-error.log;
}

# Редирект с HTTP на HTTPS
server {
    listen 80;
    server_name bunker-boats.ru;
    return 301 https://$server_name$request_uri;
}
```

## 🔧 **Шаг 3: Активация конфигурации**

```bash
# Создать символическую ссылку
sudo ln -s /etc/nginx/sites-available/bunker-api /etc/nginx/sites-enabled/

# Проверить конфигурацию
sudo nginx -t

# Если есть ошибки, исправить их
# Если всё ОК, перезагрузить Nginx
sudo systemctl reload nginx
```

## 🔧 **Шаг 4: Проверка SSL сертификатов**

```bash
# Проверить существующие сертификаты
sudo ls -la /etc/letsencrypt/live/bunker-boats.ru/

# Если сертификатов нет, создать их
sudo certbot certonly --nginx -d bunker-boats.ru

# Настроить автообновление
sudo crontab -e
# Добавить строку:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔧 **Шаг 5: Проверка работы**

```bash
# Проверить статус Nginx
sudo systemctl status nginx

# Проверить логи
sudo tail -f /var/log/nginx/bunker-api-error.log

# Тест HTTPS API
curl -k https://bunker-boats.ru/api/health

# Тест CORS
curl -H "Origin: https://yazi939.github.io" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://bunker-boats.ru/api/health
```

## 🐛 **Устранение неполадок**

### **Проблема: 502 Bad Gateway**
```bash
# Проверить, работает ли Node.js приложение
sudo lsof -i :5000
ps aux | grep node

# Перезапустить приложение если нужно
cd /path/to/your/app
npm start
```

### **Проблема: SSL сертификат не найден**
```bash
# Создать новый сертификат
sudo certbot certonly --standalone -d bunker-boats.ru

# Или обновить существующий
sudo certbot renew
```

### **Проблема: CORS ошибки**
Проверьте заголовки в ответе:
```bash
curl -I https://bunker-boats.ru/api/health
```

## 📊 **Результат**

После настройки:
- ✅ **HTTPS API**: `https://bunker-boats.ru/api/*`  
- ✅ **WebSocket**: `wss://bunker-boats.ru/socket.io/`
- ✅ **CORS поддержка**: Все домены разрешены
- ✅ **Автоматический редирект**: HTTP → HTTPS

## 🔄 **Обновление веб-приложения**

Веб-приложение теперь автоматически:
- Использует HTTPS API на HTTPS страницах
- Использует HTTP API на HTTP страницах  
- Поддерживает WebSocket через WSS
- Не показывает Mixed Content предупреждения

## 📞 **Тестирование**

1. **Откройте**: https://yazi939.github.io/bb-web/
2. **Войдите в систему** 
3. **Проверьте консоль** - должно быть: `🔗 API Base URL: https://bunker-boats.ru/api`
4. **Проверьте работу** всех функций приложения

---

**После настройки Nginx веб-приложение будет работать полностью по HTTPS без Mixed Content ошибок!** 🎉 