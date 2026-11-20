/**
 * Optional auth — attaches req.user if valid Firebase token present, null otherwise.
 */
const User = require('../models/User');
const { verifyFirebaseToken } = require('./authenticate');

const optionalAuth = async (req, res, next) => {
  req.user = null;
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return next();
    const idToken = authHeader.split(' ')[1];
    const firebaseUser = await verifyFirebaseToken(idToken);
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
