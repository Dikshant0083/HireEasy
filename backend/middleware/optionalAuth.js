/**
 * Optional auth — attaches req.user if valid Firebase token present, null otherwise.
 * Uses native https — no node-fetch dependency.
 */
const https = require('https');
const User = require('../models/User');

function firebaseRequest(idToken) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ idToken });
    const options = {
      hostname: 'identitytoolkit.googleapis.com',
      path: `/v1/accounts:lookup?key=${process.env.FIREBASE_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (!parsed.users || parsed.users.length === 0) reject(new Error('No user'));
          else resolve(parsed.users[0]);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(8000, () => req.destroy(new Error('timeout')));
    req.write(body);
    req.end();
  });
}

const optionalAuth = async (req, res, next) => {
  req.user = null;
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return next();
    const idToken = authHeader.split(' ')[1];
    const firebaseUser = await firebaseRequest(idToken);
    let user = await User.findOne({ firebase_uid: firebaseUser.localId }).select('-__v');
    if (!user && firebaseUser.email) {
      user = await User.findOne({ email: firebaseUser.email }).select('-__v');
    }
    req.user = user;
  } catch {
    req.user = null;
  }
  next();
};

module.exports = optionalAuth;
