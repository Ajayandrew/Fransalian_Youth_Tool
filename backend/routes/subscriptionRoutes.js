const express = require('express');
const router = express.Router();
const { getSubscriptions, markSubscriptionPaid, markSubscriptionUnpaid } = require('../controllers/subscriptionController');
const { authMiddleware, checkRole } = require('../middleware/auth');

router.get('/', authMiddleware, getSubscriptions);
router.post('/pay', authMiddleware, checkRole(['Admin', 'Treasurer']), markSubscriptionPaid);
router.post('/unpaid', authMiddleware, checkRole(['Admin', 'Treasurer']), markSubscriptionUnpaid);

module.exports = router;
