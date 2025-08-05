/**
 * Обнаружение Huawei устройств и применение специальных стилей
 * для улучшения адаптивности таблиц
 */

// ===== DEVICE DETECTION AND RESPONSIVE CSS LOADING =====

(function() {
    'use strict';
    
    // Функция для определения устройств Huawei
    function isHuaweiDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        const vendor = navigator.vendor ? navigator.vendor.toLowerCase() : '';
        
        // Проверяем User Agent на наличие Huawei идентификаторов
        const huaweiIdentifiers = [
            'huawei', 'honor', 'hisuite', 'hicloud', 'emui', 'harmonyos'
        ];
        
        const isHuaweiUA = huaweiIdentifiers.some(identifier => 
            userAgent.includes(identifier)
        );
        
        // Дополнительная проверка через WebGL renderer
        let isHuaweiGPU = false;
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                const renderer = gl.getParameter(gl.RENDERER).toLowerCase();
                isHuaweiGPU = renderer.includes('mali') || renderer.includes('adreno') || renderer.includes('kirin');
            }
        } catch (e) {
            // Игнорируем ошибки WebGL
        }
        
        return isHuaweiUA || (isHuaweiGPU && userAgent.includes('android'));
    }
    
    // Функция для определения планшетов
    function isTabletDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        const maxScreenSize = Math.max(screenWidth, screenHeight);
        const minScreenSize = Math.min(screenWidth, screenHeight);
        
        // Проверяем User Agent на планшетные идентификаторы
        const tabletIdentifiers = [
            'ipad', 'tablet', 'kindle', 'silk', 'playbook', 'gt-p', 'sm-t', 
            'nexus 7', 'nexus 9', 'nexus 10', 'xoom', 'sch-i800', 'android.*mobile'
        ];
        
        const isTabletUA = tabletIdentifiers.some(identifier => {
            if (identifier === 'android.*mobile') {
                return /android.*mobile/i.test(userAgent);
            }
            return userAgent.includes(identifier);
        });
        
        // Проверяем размер экрана (планшеты обычно 768px-1024px)
        const isTabletScreen = (
            (minScreenSize >= 768 && maxScreenSize <= 1024) ||
            (minScreenSize >= 600 && maxScreenSize >= 960)
        );
        
        // Исключаем телефоны
        const isMobile = /mobile|phone|android.*mobile/i.test(userAgent) && maxScreenSize < 768;
        
        return (isTabletUA || isTabletScreen) && !isMobile;
    }
    
    // Функция для загрузки адаптивных CSS файлов
    function loadResponsiveCSS() {
        const cssFiles = [
            'tablet-fixes.css',
            'global-responsive-fixes.css', 
            'fuel-trading-tablet-fixes.css',
            'additional-components-responsive.css'
        ];
        
        cssFiles.forEach((filename, index) => {
            // Проверяем, не загружен ли уже этот файл
            const existingLink = document.getElementById(`responsive-css-${index}`);
            if (existingLink) {
                return; // Файл уже загружен
            }
            
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = `./${filename}`;
            link.id = `responsive-css-${index}`;
            
            // Добавляем обработчики событий
            link.onload = function() {
                console.log(`✅ Responsive CSS loaded: ${filename}`);
            };
            
            link.onerror = function() {
                console.warn(`⚠️ Failed to load responsive CSS: ${filename}`);
            };
            
            document.head.appendChild(link);
        });
    }
    
    // Функция для применения дополнительных исправлений
    function applyAdditionalFixes() {
        // Добавляем класс smooth-scroll к body
        document.body.classList.add('smooth-scroll');
        
        // Применяем -webkit-overflow-scrolling для iOS устройств
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            const style = document.createElement('style');
            style.textContent = `
                .ant-table-wrapper,
                .tableWrapper {
                    -webkit-overflow-scrolling: touch !important;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Принудительно применяем стили к таблицам после небольшой задержки
        setTimeout(() => {
            const tables = document.querySelectorAll('.ant-table-wrapper');
            tables.forEach(table => {
                table.style.overflowX = 'auto';
                const antTable = table.querySelector('.ant-table');
                if (antTable) {
                    antTable.style.tableLayout = 'fixed';
                }
            });
        }, 1000);
    }
    
    // Основная функция инициализации
    function initializeDeviceDetection() {
        const isHuawei = isHuaweiDevice();
        const isTablet = isTabletDevice();
        
        console.log('🔍 Device Detection Results:', {
            isHuawei,
            isTablet,
            userAgent: navigator.userAgent,
            screenSize: `${window.screen.width}x${window.screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`
        });
        
        // Добавляем CSS классы к body и html
        if (isHuawei) {
            document.documentElement.classList.add('huawei-device');
            document.body.classList.add('huawei-device');
            console.log('📱 Huawei device detected - applying special styles');
        }
        
        if (isTablet) {
            document.documentElement.classList.add('tablet-device');
            document.body.classList.add('tablet-device');
            console.log('📱 Tablet device detected - applying tablet styles');
        }
        
        // Загружаем адаптивные CSS файлы
        loadResponsiveCSS();
        
        // Применяем дополнительные исправления
        applyAdditionalFixes();
        
        // Добавляем обработчики изменения ориентации и размера
        let resizeTimeout;
        function handleResize() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                console.log('📱 Screen orientation/size changed, reapplying fixes...');
                applyAdditionalFixes();
            }, 300);
        }
        
        window.addEventListener('orientationchange', handleResize);
        window.addEventListener('resize', handleResize);
        
        // Дополнительная проверка через 2 секунды для надежности
        setTimeout(() => {
            applyAdditionalFixes();
        }, 2000);
    }
    
    // Инициализация при загрузке DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDeviceDetection);
    } else {
        initializeDeviceDetection();
    }
    
    // Экспорт функций для глобального использования
    window.DeviceDetection = {
        isHuaweiDevice,
        isTabletDevice,
        loadResponsiveCSS,
        applyAdditionalFixes
    };
    
})(); 