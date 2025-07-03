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
    
    // Функция для динамической загрузки CSS
    function loadTabletFixesCSS() {
        // Проверяем, не загружен ли уже файл
        if (document.querySelector('link[href*="tablet-fixes.css"]')) {
            return;
        }
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = './tablet-fixes.css';
        link.onload = function() {
            console.log('Tablet fixes CSS loaded successfully');
        };
        link.onerror = function() {
            console.error('Failed to load tablet fixes CSS');
        };
        
        // Вставляем после основного CSS файла
        const mainCSS = document.querySelector('link[href*="main.css"]');
        if (mainCSS) {
            mainCSS.parentNode.insertBefore(link, mainCSS.nextSibling);
        } else {
            document.head.appendChild(link);
        }
    }
    
    // Функция для обработки изменения ориентации экрана
    function handleOrientationChange() {
        setTimeout(() => {
            applyDeviceClasses();
        }, 100);
    }
    
    // Инициализация при загрузке DOM
    function init() {
        loadTabletFixesCSS();
        applyDeviceClasses();
        
        // Добавляем обработчики событий
        window.addEventListener('orientationchange', handleOrientationChange);
        window.addEventListener('resize', handleOrientationChange);
        
        // Дополнительная проверка через 1 секунду для более надежного обнаружения
        setTimeout(applyDeviceClasses, 1000);
    }
    
    // Запускаем инициализацию
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(); 