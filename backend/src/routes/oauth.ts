import express from 'express';
import passport from '../config/passport';
import { authenticateOAuthUser } from '../controller/oauth';


const router = express.Router();

router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    authenticateOAuthUser
);

export default router;
