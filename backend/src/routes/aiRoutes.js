const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// AI assistant chat endpoint (public / can be used by both logged in users and guests)
router.post('/chat', aiController.chatWithAssistant);

module.exports = router;
