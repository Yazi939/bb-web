// CommonJS модуль для создания задержки
module.exports = function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

if (require.main === module) {
    // Если файл запущен напрямую
    setTimeout(() => {
        process.exit(0);
    }, 5000);
} 