/**
 * Verifies a Firebase ID token using the Firebase REST API.
 * Uses Node.js native https module — no external dependencies needed.
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
          if (!parsed.users || parsed.users.length === 0) {
            reject(new Error('Invalid or expired Firebase token'));
          } else {
            resolve(parsed.users[0]); // { localId, email, displayName, ... }
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(8000, () => { req.destroy(new Error('Firebase token verification timeout')); });
    req.write(body);
    req.end();
  });
}

async function verifyFirebaseToken(idToken) {
  return firebaseRequest(idToken);
}

// ── Required auth middleware ──────────────────────────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const idToken = authHeader.split(' ')[1];
    
    let firebaseUser;
    try {
      firebaseUser = await verifyFirebaseToken(idToken);
    } catch (tokenErr) {
      console.error('❌ Firebase token verification failed:', tokenErr.message);
      return res.status(401).json({ success: false, message: `Token error: ${tokenErr.message}` });
    }

    // Find user by firebase_uid first, then by email (for migrated accounts)
    let user = await User.findOne({ firebase_uid: firebaseUser.localId }).select('-__v');
    if (!user && firebaseUser.email) {
      user = await User.findOne({ email: firebaseUser.email }).select('-__v');
      if (user && !user.firebase_uid) {
        // Patch missing firebase_uid on old account
        await User.updateOne({ _id: user._id }, { $set: { firebase_uid: firebaseUser.localId } });
      }
    }
    if (!user) {
      console.error('❌ No MongoDB user found for firebase_uid:', firebaseUser.localId, 'email:', firebaseUser.email);
      return res.status(401).json({ success: false, message: 'User profile not found. Please complete registration.' });
    }
    req.user = user;
    req.firebaseUser = firebaseUser;
    next();
  } catch (err) {
    console.error('❌ Auth middleware unexpected error:', err.message);
    return res.status(401).json({ success: false, message: 'Authentication failed' });
  }
};

module.exports = authenticate;
module.exports.verifyFirebaseToken = verifyFirebaseToken;
