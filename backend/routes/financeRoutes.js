const express = require('express');
const router = express.Router();
const { getFinanceSummary, addIncome, addExpense, addSecretOffering, deleteIncome, deleteExpense } = require('../controllers/financeController');
const { authMiddleware, checkRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/summary', authMiddleware, getFinanceSummary);
router.post('/income', authMiddleware, checkRole(['Admin', 'Treasurer']), upload.single('receiptImage'), addIncome);
router.post('/expense', authMiddleware, checkRole(['Admin', 'Treasurer']), upload.single('receiptImage'), addExpense);
router.post('/secret-offering', authMiddleware, checkRole(['Admin', 'Treasurer']), addSecretOffering);
router.delete('/income/:id', authMiddleware, checkRole(['Admin', 'Treasurer']), deleteIncome);
router.delete('/expense/:id', authMiddleware, checkRole(['Admin', 'Treasurer']), deleteExpense);

module.exports = router;
