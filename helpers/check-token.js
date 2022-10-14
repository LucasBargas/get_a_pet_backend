/* eslint-disable consistent-return */
const jwt = require('jsonwebtoken');
const getToken = require('./get-token');

// middleware to validate token
const checkToken = (req, res, next) => {
  if (!req.headers.authorization) {
    res.status(401).json({ message: 'Acesso negado!' });
    return;
  }

  const token = getToken(req);

  if (!token) {
    res.status(401).json({ message: 'Acesso negado!' });
    return;
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next(); // to continue the flow
  } catch (err) {
    res.status(400).json({ message: 'O Token é inválido!' });
    return;
  }
};

module.exports = checkToken;
