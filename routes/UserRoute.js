const router = require('express').Router();
const UserController = require('../controllers/UserController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const authenticateJWT = require('../middlewares/authenticateJWT');
router.use(authenticateJWT);


router.get('/register', UserController.UserRegisterForm)
router.post('/register', UserController.RegisterUser)
router.get('/login', AuthMiddleware.PreventLoggedIn, UserController.UserLoginForm)
router.post('/login', UserController.LoginUser)
router.get('/logout', AuthMiddleware.CheckLogin, UserController.LogoutUser)
router.get('/profile', AuthMiddleware.CheckLogin, UserController.UserProfile)
router.get('/edit-profile', UserController.EditProfileForm)
router.post('/update_profile_pic', UserController.user_upload.single('image'), UserController.UpdateProfilePic)
router.post('/personal_details', UserController.PersonalDetails)
router.get('/forget-password', AuthMiddleware.PreventLoggedIn, UserController.ForgetPassword)
router.post('/forget-password', UserController.ForgetPasswordVerify)
router.post('/otp', UserController.OTPCodeVerify)
router.post('/reset-password', UserController.PasswordReset)
router.get('/user_expenses', UserController.UserExpenses);
router.post('/add_expense', UserController.AddUserExpense);
router.get('/user_expense/delete/:id', UserController.UserExpenseDeleteById);
router.get('/get_user_expenses', UserController.getUserExpenses);

router.get('/analysis', UserController.UserAnalysis);
router.get('/analysisUserBySort', UserController.AnalysisBySorting);
router.post('/update_expense_user', UserController.UpdateUserExpense);
router.post('/notifications/mark-all-read', UserController.NotificationsMarksAsRead);

module.exports = router;