const { User } = require('../models');

const authController = {
  // @desc    Регистрация пользователя
  // @route   POST /api/users/register
  // @access  Public
  register: async (req, res) => {
    try {
      const { username, password, role } = req.body;

      // Проверка, существует ли пользователь
      const userExists = await User.findOne({ where: { username } });
      if (userExists) {
        return res.status(400).json({
          success: false,
          error: 'Пользователь с таким именем уже существует'
        });
      }

      // Генерируем уникальный ID
      const userId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      
      // Создание пользователя
      const user = await User.create({
        id: userId,
        username,
        password,
        role: role || 'worker'
      });

      sendTokenResponse(user, 201, res);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  // @desc    Авторизация пользователя
  // @route   POST /api/users/login
  // @access  Public
  login: async (req, res) => {
    try {
      const { username, password } = req.body;

      // Проверка наличия username и пароля
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Пожалуйста, укажите имя пользователя и пароль'
        });
      }

      // Поиск пользователя по username
      const user = await User.findOne({ where: { username } });
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Неверное имя пользователя или пароль'
        });
      }

      // Проверка пароля
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Неверное имя пользователя или пароль'
        });
      }

      sendTokenResponse(user, 200, res);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  // @desc    Получить текущего пользователя
  // @route   GET /api/users/me
  // @access  Private
  getMe: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id);
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
};

// Получить JWT токен, создать cookie и отправить ответ
const sendTokenResponse = (user, statusCode, res) => {
  // Создание токена
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 дней
    ),
    httpOnly: true
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
};

module.exports = authController; 