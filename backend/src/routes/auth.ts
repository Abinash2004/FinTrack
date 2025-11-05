import express from 'express';
import { initiateUserSignUp, verifyUserSignUp,userSignIn, refreshAccessToken} from '../controller/auth';

const router = express.Router();

router.post('/signup/initiate', initiateUserSignUp);
router.post('/signup/verify', verifyUserSignUp);
router.post('/signin', userSignIn);
router.post('/refreshaccesstoken', refreshAccessToken);

export default router;