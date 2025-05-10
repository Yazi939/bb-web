const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Защита маршрутов
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Установка токена из Bearer токена в заголовке
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    // Установка токена из cookie
    token = req.cookies.token;
  }

  // Проверка наличия токена
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Не авторизован для доступа к этому маршруту'
    });
  }

  try {
    // Проверка токена
    const decoded = jwt.verify(token, 'your-super-secret-key-here');

    // Получаем пользователя по ID из токена
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Не авторизован для доступа к этому маршруту'
    });
  }
};

// Предоставление доступа к определенным ролям
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'У вас нет прав для выполнения этого действия'
      });
    }
    next();
  };
}; 