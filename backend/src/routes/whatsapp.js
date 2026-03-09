// =====================================================
// WhatsApp Integration Routes
// API endpoints for sending WhatsApp notifications
// =====================================================

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validator');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

router.use(authenticateToken);
router.use(authorizeRoles('super_admin', 'admin'));

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WA_ENABLED = !!(WHATSAPP_API_URL && WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID);

// Shared helper — uses real API when env vars are set, falls back to mock
const sendWhatsAppMessage = async (phoneNumber, text) => {
  if (!WA_ENABLED) {
    logger.warn(`WhatsApp not configured — mock send to ${phoneNumber}`);
    return { phoneNumber, status: 'queued', messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
  }
  const response = await axios.post(
    `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
    { messaging_product: 'whatsapp', to: phoneNumber, type: 'text', text: { body: text } },
    { headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' } }
  );
  return { phoneNumber, status: 'sent', messageId: response.data.messages[0].id };
};

// @route   POST /api/whatsapp/send-voting-link
// @desc    Send voting link to users via WhatsApp
// @access  Private (Admin/Super Admin)
router.post('/send-voting-link', [
  body('recipients').isArray({ min: 1 }).withMessage('Recipients array is required'),
  body('recipients.*.phoneNumber').isMobilePhone().withMessage('Valid phone number required'),
  body('recipients.*.name').optional().isString(),
  body('sessionId').isInt().withMessage('Session ID is required'),
  body('votingUrl').isURL().withMessage('Valid voting URL required'),
  body('message').optional().isString(),
  validate
], asyncHandler(async (req, res) => {
  const { recipients, sessionId, votingUrl, message } = req.body;

  logger.info(`WhatsApp voting link requested for ${recipients.length} recipients in session ${sessionId} by user ${req.user.userId}`);

  const results = await Promise.all(recipients.map(async (recipient) => {
    const text = message || `Hello ${recipient.name || 'there'}!\n\nYou have been invited to vote in the AGM session.\n\nVoting link: ${votingUrl}\nSession ID: ${sessionId}\n\nPlease complete your vote before the session closes.\n\nThank you for participating!`;
    try {
      return await sendWhatsAppMessage(recipient.phoneNumber, text);
    } catch (err) {
      logger.error(`WhatsApp send failed for ${recipient.phoneNumber}:`, err.message);
      return { phoneNumber: recipient.phoneNumber, status: 'failed', error: err.message };
    }
  }));

  res.json({
    message: `Voting link notifications sent to ${results.filter(r => r.status === 'sent').length}/${recipients.length} recipients`,
    sessionId,
    recipientCount: recipients.length,
    results
  });
}));

// @route   POST /api/whatsapp/send-session-start
// @desc    Send session start notification
// @access  Private (Admin/Super Admin)
router.post('/send-session-start', [
  body('recipients').isArray({ min: 1 }).withMessage('Recipients array is required'),
  body('recipients.*.phoneNumber').isMobilePhone().withMessage('Valid phone number required'),
  body('sessionId').isInt().withMessage('Session ID is required'),
  body('sessionName').notEmpty().withMessage('Session name is required'),
  body('startTime').isISO8601().withMessage('Valid start time required'),
  body('votingUrl').isURL().withMessage('Valid voting URL required'),
  validate
], asyncHandler(async (req, res) => {
  const { recipients, sessionId, sessionName, startTime, votingUrl } = req.body;

  logger.info(`WhatsApp session start notification for session ${sessionId} to ${recipients.length} recipients by user ${req.user.userId}`);

  const results = await Promise.all(recipients.map(async (recipient) => {
    const text = `The AGM voting session "${sessionName}" has started!\n\nStart time: ${new Date(startTime).toLocaleString()}\nVoting link: ${votingUrl}\nSession ID: ${sessionId}\n\nPlease cast your votes now.`;
    try {
      return await sendWhatsAppMessage(recipient.phoneNumber, text);
    } catch (err) {
      logger.error(`WhatsApp send failed for ${recipient.phoneNumber}:`, err.message);
      return { phoneNumber: recipient.phoneNumber, status: 'failed', error: err.message };
    }
  }));

  res.json({
    message: `Session start notifications sent to ${results.filter(r => r.status === 'sent').length}/${recipients.length} recipients`,
    sessionId,
    recipientCount: recipients.length,
    results
  });
}));

// @route   POST /api/whatsapp/send-reminder
// @desc    Send voting reminder
// @access  Private (Admin/Super Admin)
router.post('/send-reminder', [
  body('recipients').isArray({ min: 1 }).withMessage('Recipients array is required'),
  body('recipients.*.phoneNumber').isMobilePhone().withMessage('Valid phone number required'),
  body('sessionId').isInt().withMessage('Session ID is required'),
  body('reminderMessage').notEmpty().withMessage('Reminder message is required'),
  body('votingUrl').optional().isURL(),
  validate
], asyncHandler(async (req, res) => {
  const { recipients, sessionId, reminderMessage, votingUrl } = req.body;

  logger.info(`WhatsApp reminder for session ${sessionId} to ${recipients.length} recipients by user ${req.user.userId}`);

  const results = await Promise.all(recipients.map(async (recipient) => {
    const text = `${reminderMessage}${votingUrl ? `\n\nVoting link: ${votingUrl}` : ''}`;
    try {
      return await sendWhatsAppMessage(recipient.phoneNumber, text);
    } catch (err) {
      logger.error(`WhatsApp send failed for ${recipient.phoneNumber}:`, err.message);
      return { phoneNumber: recipient.phoneNumber, status: 'failed', error: err.message };
    }
  }));

  res.json({
    message: `Reminder notifications sent to ${results.filter(r => r.status === 'sent').length}/${recipients.length} recipients`,
    sessionId,
    recipientCount: recipients.length,
    results
  });
}));

// @route   GET /api/whatsapp/delivery-status/:messageId
// @desc    Check message delivery status
// @access  Private (Admin/Super Admin)
router.get('/delivery-status/:messageId', [
  param('messageId').notEmpty(),
  validate
], asyncHandler(async (req, res) => {
  const { messageId } = req.params;

  if (!WA_ENABLED) {
    return res.json({ messageId, status: 'unknown', note: 'WhatsApp API not configured', timestamp: new Date().toISOString() });
  }
  try {
    const response = await axios.get(
      `${WHATSAPP_API_URL}/${messageId}`,
      { headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}` } }
    );
    res.json({
      messageId,
      status: response.data.status,
      timestamp: response.data.timestamp,
      recipient: response.data.recipient_id
    });
  } catch (error) {
    throw new AppError(`Failed to get delivery status: ${error.message}`, 500);
  }
}));

// @route   POST /api/whatsapp/send-bulk
// @desc    Send bulk WhatsApp messages
// @access  Private (Admin/Super Admin)
router.post('/send-bulk', [
  body('recipients').isArray({ min: 1 }).withMessage('Recipients array is required'),
  body('recipients.*.phoneNumber').isMobilePhone().withMessage('Valid phone number required'),
  body('recipients.*.message').notEmpty().withMessage('Message required for each recipient'),
  body('sessionId').optional().isInt(),
  validate
], asyncHandler(async (req, res) => {
  const { recipients, sessionId } = req.body;

  logger.info(`Bulk WhatsApp send for ${recipients.length} recipients by user ${req.user.userId}`);

  const results = await Promise.all(recipients.map(async (recipient) => {
    try {
      return await sendWhatsAppMessage(recipient.phoneNumber, recipient.message);
    } catch (err) {
      logger.error(`WhatsApp bulk send failed for ${recipient.phoneNumber}:`, err.message);
      return { phoneNumber: recipient.phoneNumber, status: 'failed', error: err.message };
    }
  }));

  res.json({
    message: `Bulk send complete: ${results.filter(r => r.status === 'sent').length}/${recipients.length} sent`,
    sessionId,
    recipientCount: recipients.length,
    results
  });
}));

module.exports = router;
