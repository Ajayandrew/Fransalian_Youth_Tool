const express = require('express');
const router = express.Router();
const { 
  getFinanceSummary, 
  addIncome, 
  addExpense, 
  addSecretOffering, 
  deleteIncome, 
  deleteExpense,
  deleteSecretOffering 
} = require('../controllers/financeController');
const { authMiddleware, checkRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

const FINANCE_ROLES = ['Admin', 'Treasurer', 'Youth Leader', 'Parish Priest'];

router.get('/summary', authMiddleware, getFinanceSummary);
router.post('/income', authMiddleware, checkRole(FINANCE_ROLES), upload.single('receiptImage'), addIncome);
router.post('/expense', authMiddleware, checkRole(FINANCE_ROLES), upload.single('receiptImage'), addExpense);
router.post('/secret-offering', authMiddleware, checkRole(FINANCE_ROLES), addSecretOffering);
router.delete('/income/:id', authMiddleware, checkRole(FINANCE_ROLES), deleteIncome);
router.delete('/expense/:id', authMiddleware, checkRole(FINANCE_ROLES), deleteExpense);
router.delete('/secret-offering/:id', authMiddleware, checkRole(FINANCE_ROLES), deleteSecretOffering);

module.exports = router;
