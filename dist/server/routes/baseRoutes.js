const express = require('express');
const { protect } = require('../middleware/auth');

const createBaseRouter = (controller) => {
  const router = express.Router();

  router
    .route('/')
    .get(protect, controller.getAll)
    .post(protect, controller.create);

  router
    .route('/:id')
    .get(protect, controller.getOne)
    .put(protect, controller.update)
    .delete(protect, controller.delete);

  return router;
};

module.exports = createBaseRouter; 