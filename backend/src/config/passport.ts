import dotenv from 'dotenv';
import pool from './database';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

dotenv.config({ quiet: true });

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL as string;

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        const name = profile.displayName;
        const providerId = profile.id;

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        let user;

        if (result.rows.length > 0) {
          user = result.rows[0];

          if (user.provider === 'local') {
            const update = await pool.query(
              'UPDATE users SET provider=$1, provider_id=$2 WHERE id=$3 RETURNING *',
              ['google', providerId, user.id]
            );
            user = update.rows[0];
          }
        } else {
          const insert = await pool.query(
            `INSERT INTO users (name, email, provider, provider_id)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [name, email, 'google', providerId]
          );
          user = insert.rows[0];
        }

        done(null, user);
      } catch (err) {
        done(err, undefined);
      }
    }
  )
);

export default passport;
