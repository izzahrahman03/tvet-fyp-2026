const express = require('express');
const router  = express.Router();

const { verifyToken, requireSupervisor } = require('../middleware/authMiddleware');
const evaluationControllers        = require('../controllers/evaluationControllers');
const studentEvaluationControllers = require('../controllers/studentEvaluationControllers');

router.get('/supervisor/students',                             verifyToken, requireSupervisor, evaluationControllers.listAssignedStudents);
router.get('/supervisor/evaluations/:applicationId',           verifyToken, requireSupervisor, evaluationControllers.getEvaluation);
router.post('/supervisor/evaluations',                         verifyToken, requireSupervisor, evaluationControllers.saveEvaluation);
router.delete('/supervisor/evaluations/:applicationId',        verifyToken, requireSupervisor, evaluationControllers.deleteEvaluation);
router.get('/student/my-evaluation', verifyToken, studentEvaluationControllers.getMyEvaluation);


module.exports = router;