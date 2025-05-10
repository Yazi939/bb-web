const express = require('express');
const router = express.Router();
const { Data } = require('../models');
const { protect } = require('../middleware/auth');

// Получение данных для синхронизации
router.get('/:dataType', protect, async (req, res) => {
    try {
        const data = await Data.findOne({
            where: {
                userId: req.user.id,
                dataType: req.params.dataType
            },
            order: [['version', 'DESC']]
        });

        if (!data) {
            return res.status(404).json({ message: 'Data not found' });
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Отправка данных для синхронизации
router.post('/:dataType', protect, async (req, res) => {
    try {
        const { data } = req.body;
        
        const existingData = await Data.findOne({
            where: {
                userId: req.user.id,
                dataType: req.params.dataType
            },
            order: [['version', 'DESC']]
        });

        const newVersion = existingData ? existingData.version + 1 : 1;

        const newData = await Data.create({
            userId: req.user.id,
            dataType: req.params.dataType,
            data,
            version: newVersion
        });

        res.json(newData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 