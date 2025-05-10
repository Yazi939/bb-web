const express = require('express');
const bodyParser = require('body-parser');
const sequelize = require('./config/database');
const orderRoutes = require('./routes/orderRoutes');
const shiftRoutes = require('./routes/shiftRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(bodyParser.json());

app.use('/api', orderRoutes);
app.use('/api', shiftRoutes);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
}); 