const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Начинаем сборку веб-версии Bunker Boats...');

// Функция для выполнения команд
function runCommand(command, description) {
  console.log(`⚡ ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} завершено`);
  } catch (error) {
    console.error(`❌ Ошибка при ${description}:`, error.message);
    process.exit(1);
  }
}

// Функция для копирования файлов
function copyFile(src, dest) {
  try {
    fs.copyFileSync(src, dest);
    console.log(`📄 Скопирован: ${src} → ${dest}`);
  } catch (error) {
    console.warn(`⚠️  Не удалось скопировать ${src}:`, error.message);
  }
}

// Функция для создания папки если её нет
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Создана папка: ${dir}`);
  }
}

// Основной процесс сборки
async function buildWeb() {
  try {
    // 1. Очистка папки web-deploy
    console.log('🧹 Очистка папки web-deploy...');
    if (fs.existsSync('web-deploy')) {
      fs.rmSync('web-deploy', { recursive: true, force: true });
    }
    ensureDir('web-deploy');

    // 2. Проверяем наличие node_modules и устанавливаем зависимости если нужно
    if (!fs.existsSync('node_modules')) {
      console.log('📦 Установка зависимостей...');
      // Если нет package.json в корне, создаем минимальный
      if (!fs.existsSync('package.json')) {
        const packageJson = {
          "name": "bunker-boats-web-build",
          "version": "2.1.13",
          "type": "module",
          "scripts": {
            "build-web": "vite build --config vite.config.web.ts"
          },
          "devDependencies": {
            "@types/node": "^20.0.0",
            "@vitejs/plugin-react": "^4.0.0",
            "typescript": "^5.0.0",
            "vite": "^5.0.0"
          }
        };
        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
        console.log('📄 Создан package.json');
      }
      runCommand('npm install', 'Установка зависимостей');
    }

    // 3. Сборка с помощью Vite
    runCommand('npx vite build --config vite.config.web.ts', 'Сборка веб-версии');

    // 4. Копирование статических файлов
    console.log('📋 Копирование статических файлов...');
    
    // Копируем иконки
    const staticFiles = [
      { src: 'icon-192.jpg', dest: 'web-deploy/icon-192x192.png' },
      { src: 'icon-512.jpg', dest: 'web-deploy/icon-512x512.png' },
      { src: 'icon.ico', dest: 'web-deploy/favicon.ico' },
      { src: 'bunker-logo.jpg', dest: 'web-deploy/bunker-logo.jpg' },
      { src: 'manifest-web.json', dest: 'web-deploy/manifest.json' },
      { src: 'CNAME', dest: 'web-deploy/CNAME' }
    ];

    staticFiles.forEach(({ src, dest }) => {
      if (fs.existsSync(src)) {
        copyFile(src, dest);
      }
    });

    // 5. Обновляем HTML файл для правильных путей
    const indexPath = 'web-deploy/index.html';
    if (fs.existsSync(indexPath)) {
      let htmlContent = fs.readFileSync(indexPath, 'utf8');
      
      // Обновляем пути к иконкам
      htmlContent = htmlContent
        .replace(/\.\/icon-192x192\.png/g, './icon-192x192.png')
        .replace(/\.\/icon-512x512\.png/g, './icon-512x512.png')
        .replace(/\.\/favicon\.ico/g, './favicon.ico')
        .replace(/\.\/manifest-web\.json/g, './manifest.json');
      
      fs.writeFileSync(indexPath, htmlContent);
      console.log('📄 Обновлен index.html');
    }

    // 6. Создаем .nojekyll файл для GitHub Pages
    fs.writeFileSync('web-deploy/.nojekyll', '');
    console.log('📄 Создан .nojekyll для GitHub Pages');

    // 7. Создаем README для веб-деплоя
    const readmeContent = `# Bunker Boats Web Version

Это веб-версия приложения Bunker Boats, собранная для деплоя на GitHub Pages.

## Информация о сборке
- Версия: 2.1.13
- Дата сборки: ${new Date().toLocaleString('ru-RU')}
- Собрано из основной desktop версии

## Файлы
- \`index.html\` - главная страница приложения
- \`main.js\` - основной JavaScript код
- \`*.js\` - чанки приложения (React, Antd, утилиты)
- \`main.css\` - стили приложения
- \`manifest.json\` - манифест PWA
- Иконки и статические ресурсы

## Деплой
Эти файлы предназначены для загрузки в ветку \`gh-pages\` репозитория \`bb-web\`.
`;

    fs.writeFileSync('web-deploy/README.md', readmeContent);
    console.log('📄 Создан README.md');

    console.log('\n🎉 Сборка веб-версии завершена успешно!');
    console.log('📁 Файлы для деплоя находятся в папке: web-deploy/');
    console.log('\n📋 Следующие шаги:');
    console.log('1. Скопируйте все файлы из папки web-deploy/');
    console.log('2. Загрузите их в репозиторий bb-web ветка gh-pages');
    console.log('3. Убедитесь что GitHub Pages настроен на ветку gh-pages');
    
    // Показываем список файлов
    console.log('\n📄 Собранные файлы:');
    const files = fs.readdirSync('web-deploy');
    files.forEach(file => {
      const stats = fs.statSync(path.join('web-deploy', file));
      const size = (stats.size / 1024).toFixed(1);
      console.log(`   ${file} (${size} KB)`);
    });

  } catch (error) {
    console.error('❌ Ошибка при сборке:', error.message);
    process.exit(1);
  }
}

// Запускаем сборку
buildWeb(); 