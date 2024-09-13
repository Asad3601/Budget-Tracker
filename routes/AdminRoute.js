const router = require('express').Router();
const AdminController = require('../controllers/AdminController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
// const authenticateJWT = require('../middlewares/authenticateJWT');
// router.use(authenticateJWT);


router.get('/users', AuthMiddleware.CheckAdmin, AdminController.AllUsers);
router.get('/all_expenses', AuthMiddleware.CheckAdmin, AdminController.AllUserExpenses);
router.get('/user_expense/:id', AuthMiddleware.CheckAdmin, AdminController.User_Expense);
router.get('/get_user_expense_by_admin/:id', AuthMiddleware.CheckAdmin, AdminController.getUserExpensesByAdmin);
router.post('/add_expenseByAdmin', AuthMiddleware.CheckAdmin, AdminController.AddUserExpenseByAdmin);
router.get('/user_analysis/:id', AuthMiddleware.CheckAdmin, AdminController.UserAnalysisByAdmin);
router.get('/analysisBySort', AuthMiddleware.CheckAdmin, AdminController.UserAnalysisBySorting);
router.get('/expense_delete/:id', AuthMiddleware.CheckAdmin, AdminController.UserExpenseDeleteByAdmin);
router.post('/update_user', AuthMiddleware.CheckAdmin, AdminController.UpdateUserByAdmin);
router.post('/update_expenseByAdmin', AuthMiddleware.CheckAdmin, AdminController.UpdateUserExpenseByAdmin);



module.exports = router;