import express from 'express';
import { userSignUp,userSignIn, refreshAccessToken} from '../controller/auth';

const router = express.Router();

router.post('/signup', userSignUp);
router.post('/signin', userSignIn);
router.post('/refreshaccesstoken', refreshAccessToken);

export default router;