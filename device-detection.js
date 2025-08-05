/**
 * Обнаружение Huawei устройств и применение специальных стилей
 * для улучшения адаптивности таблиц
 */

(function() {
    'use strict';
    
    // Функция для обнаружения Huawei устройств
    function detectHuaweiDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        const vendor = navigator.vendor ? navigator.vendor.toLowerCase() : '';
        
        // Проверяем различные способы обнаружения Huawei устройств
        const huaweiKeywords = [
            'huawei',
            'honor',
            'hi3660',
            'kirin',
            'hisilicon',
            'emui',
            'harmonyos'
        ];
        
        const isHuawei = huaweiKeywords.some(keyword => 
            userAgent.includes(keyword) || vendor.includes(keyword)
        );
        
        // Дополнительная проверка через WebGL renderer (если доступен)
        let isHuaweiGPU = false;
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
                    isHuaweiGPU = renderer.includes('mali') || renderer.includes('adreno') || renderer.includes('kirin');
                }
            }
        } catch (e) {
            console.log('WebGL detection failed:', e);
        }
        
        return isHuawei || isHuaweiGPU;
    }
    
    // Функция для обнаружения планшетов
    function isTabletDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        const isTablet = /tablet|ipad|playbook|silk|(android(?!.*mobile))/i.test(userAgent);
        
        // Дополнительная проверка по размерам экрана
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        const minSize = Math.min(screenWidth, screenHeight);
        const maxSize = Math.max(screenWidth, screenHeight);
        
        // Планшеты обычно имеют размеры от 768px до 1024px по меньшей стороне
        const isSizeTablet = minSize >= 768 && minSize <= 1024 && maxSize >= 1024;
        
        return isTablet || isSizeTablet;
    }
    
    // Функция для применения классов устройства
    function applyDeviceClasses() {
        const body = document.body;
        const html = document.documentElement;
        
        if (detectHuaweiDevice()) {
            body.classList.add('huawei-device');
            html.classList.add('huawei-device');
            console.log('Huawei device detected - applying enhanced tablet styles');
        }
        
        if (isTabletDevice()) {
            body.classList.add('tablet-device');
            html.classList.add('tablet-device');
            console.log('Tablet device detected');
        }
        
        // Логирование информации о устройстве для отладки
        console.log('Device info:', {
            userAgent: navigator.userAgent,
            vendor: navigator.vendor,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            isHuawei: detectHuaweiDevice(),
            isTablet: isTabletDevice()
        });
    }
    
    // Функция для динамической загрузки CSS файлов
    function loadResponsiveCSS() {
        const cssFiles = [
            { 
                href: './tablet-fixes.css', 
                id: 'tablet-fixes-css',
                description: 'Tablet fixes CSS'
            },
            { 
                href: './global-responsive-fixes.css', 
                id: 'global-responsive-css',
                description: 'Global responsive fixes CSS'
            },
            { 
                href: './fuel-trading-tablet-fixes.css', 
                id: 'fuel-trading-tablet-css',
                description: 'FuelTrading tablet fixes CSS'
            }
        ];
        
        cssFiles.forEach(cssFile => {
            // Проверяем, не загружен ли уже файл
            if (document.querySelector(`#${cssFile.id}`)) {
                return;
            }
            
            const link = document.createElement('link');
            link.id = cssFile.id;
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = cssFile.href;
            link.onload = function() {
                console.log(`${cssFile.description} loaded successfully`);
            };
            link.onerror = function() {
                console.error(`Failed to load ${cssFile.description}`);
            };
            
            // Вставляем после основного CSS файла
            const mainCSS = document.querySelector('link[href*="main.css"]');
            if (mainCSS) {
                mainCSS.parentNode.insertBefore(link, mainCSS.nextSibling);
            } else {
                document.head.appendChild(link);
            }
        });
    }
    
    // Функция для обработки изменения ориентации экрана
    function handleOrientationChange() {
        setTimeout(() => {
            applyDeviceClasses();
            
            // Принудительное обновление стилей таблиц
            const tables = document.querySelectorAll('.ant-table-wrapper');
            tables.forEach(table => {
                table.style.overflowX = 'auto';
                table.style.webkitOverflowScrolling = 'touch';
            });
        }, 100);
    }
    
    // Функция для применения дополнительных исправлений
    function applyAdditionalFixes() {
        // Добавляем класс для улучшенной прокрутки
        document.body.classList.add('smooth-scroll');
        
        // Исправляем проблемы с прокруткой на iOS
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            document.body.style.webkitOverflowScrolling = 'touch';
        }
        
        // Принудительное применение стилей к таблицам
        setTimeout(() => {
            const tables = document.querySelectorAll('.ant-table-wrapper');
            tables.forEach(table => {
                table.style.overflowX = 'auto';
                table.style.webkitOverflowScrolling = 'touch';
            });
            
            // Исправление для FuelTrading таблиц
            const fuelTradingTables = document.querySelectorAll('.fuelTrading .responsiveTable, .responsiveTable');
            fuelTradingTables.forEach(table => {
                table.style.minWidth = '1200px';
                table.style.tableLayout = 'fixed';
            });
        }, 500);
    }
    
    // Инициализация при загрузке DOM
    function init() {
        loadResponsiveCSS();
        applyDeviceClasses();
        applyAdditionalFixes();
        
        // Добавляем обработчики событий
        window.addEventListener('orientationchange', handleOrientationChange);
        window.addEventListener('resize', handleOrientationChange);
        
        // Дополнительная проверка через 1 секунду для более надежного обнаружения
        setTimeout(() => {
            applyDeviceClasses();
            applyAdditionalFixes();
        }, 1000);
        
        // Еще одна проверка через 3 секунды для случаев медленной загрузки
        setTimeout(() => {
            applyAdditionalFixes();
        }, 3000);
    }
    
    // Запускаем инициализацию
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(); 