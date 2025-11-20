import express from 'express';
import Employee from '../models/Employee.js';
const router = express.Router();

// ✅ SPECIFIC ROUTES FIRST - Place /registration-data BEFORE parameterized routes
router.get('/registration-data', async (req, res) => {
  try {
    const data = await Employee.getAllReg();

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error(' Error loading registration data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load registration data'
    });
  }
});

export default router;