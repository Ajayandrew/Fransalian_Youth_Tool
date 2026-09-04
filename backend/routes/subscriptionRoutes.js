const express = require('express');
const router = express.Router();
const {
  getSubscriptions,
  getMemberSubscriptionHistory,
  markSubscriptionPaid,
  markSubscriptionUnpaid,
  sendSubscriptionSMS
} = require('../controllers/subscriptionController');
const { authMiddleware, checkRole } = require('../middleware/auth');

router.get('/', authMiddleware, getSubscriptions);
router.get('/history', authMiddleware, getMemberSubscriptionHistory);
router.post('/pay', authMiddleware, checkRole(['Admin', 'Treasurer']), markSubscriptionPaid);
router.post('/unpaid', authMiddleware, checkRole(['Admin', 'Treasurer']), markSubscriptionUnpaid);
router.post('/send-sms', authMiddleware, checkRole(['Admin', 'Treasurer']), sendSubscriptionSMS);

module.exports = router;


