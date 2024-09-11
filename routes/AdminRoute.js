const router = require('express').Router();
const AdminController = require('../controllers/AdminController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
// const authenticateJWT = require('../middlewares/authenticateJWT');
// router.use(authenticateJWT);


router.get('/users', AuthMiddleware.CheckAdmin, AdminController.AllUsers);
router.get('/all_expenses', AdminController.AllUserExpenses);
router.get('/user_expense/:id', AdminController.User_Expense);
router.get('/get_user_expense_by_admin/:id', AdminController.getUserExpensesByAdmin);
router.post('/add_expenseByAdmin', AdminController.AddUserExpenseByAdmin);
router.get('/user_analysis/:id', AdminController.UserAnalysisByAdmin);
router.get('/analysisBySort', AdminController.UserAnalysisBySorting);
router.get('/expense_delete/:id', AdminController.UserExpenseDeleteByAdmin);



module.exports = router;