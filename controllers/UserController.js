const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Helpers
const createUserToken = require('../helpers/create-user-token');
const getToken = require('../helpers/get-token');
const getUserByToken = require('../helpers/get-user-by-token');

const User = require('../models/User');

module.exports = class UserController {
  static async register(req, res) {
    const { name, email, password, confirmpassword, phone } = req.body;

    // Validations
    if (!name) {
      // 422 - ocurred an error
      res.status(422).json({ message: 'O nome é obrigatório' });
      return;
    }

    if (!email) {
      res.status(422).json({ message: 'O email é obrigatório' });
      return;
    }

    if (!password) {
      res.status(422).json({ message: 'A senha é obrigatória' });
      return;
    }

    if (!confirmpassword) {
      res.status(422).json({ message: 'A confirmação de senha é obrigatória' });
      return;
    }

    if (password !== confirmpassword) {
      res.status(422).json({
        message: 'A senha e a confirmação de senha precisam ser iguais',
      });
      return;
    }

    if (!phone) {
      res.status(422).json({ message: 'O número para contato é obrigatório' });
      return;
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(422).json({
        message: 'Usuário já cadastrado! Por favor, insira outro email.',
      });
      return;
    }

    // Create a password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create a user
    const user = new User({
      name,
      email,
      password: passwordHash,
      phone,
    });

    try {
      const newUser = await user.save();
      await createUserToken(newUser, req, res);
    } catch (err) {
      res.status(500).json({ message: err });
      return;
    }
  }

  static async login(req, res) {
    const { email, password } = req.body;

    if (!email) {
      res.status(422).json({ message: 'O email é obrigatório' });
      return;
    }

    if (!password) {
      res.status(422).json({ message: 'A senha é obrigatória' });
      return;
    }

    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      res.status(422).json({
        message: 'Não há usuário cadastrado com este email.',
      });
      return;
    }

    // Check if password match with db password
    const checkPassword = await bcrypt.compare(password, user.password);

    if (!checkPassword) {
      res.status(422).json({
        message: 'Senha inválida.',
      });
      return;
    }

    try {
      await createUserToken(user, req, res);
    } catch (err) {
      res.status(500).json({ message: err });
      return;
    }
  }

  static async checkUser(req, res) {
    let currentUser;

    // The token stay on the headers
    if (req.headers.authorization) {
      const token = getToken(req);
      const decoded = jwt.verify(token, 'nossosecret');

      currentUser = await User.findById(decoded.id);

      currentUser.password = undefined;
    } else {
      currentUser = null;
    }

    res.status(200).json(currentUser);
  }

  static async getUserById(req, res) {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');

    if (!user) {
      res.status(422).json({
        message: 'Usuário não encontrado.',
      });
      return;
    }

    res.status(200).json({ user });
  }

  static async editUser(req, res) {
    const token = getToken(req);
    const user = await getUserByToken(token, req, res);

    const { name, email, password, confirmpassword, phone } = req.body;

    if (req.file) {
      user.image = req.file.filename;
    }

    // Validations
    if (!name) {
      res.status(422).json({ message: 'O nome é obrigatório' });
      return;
    }

    user.name = name;

    if (!email) {
      res.status(422).json({ message: 'O email é obrigatório' });
      return;
    }

    // Check if email has already taken
    const userExists = await User.findOne({ email });

    if (user.email !== email && userExists) {
      res.status(422).json({
        message: 'Email já cadastrado.',
      });
      return;
    }

    user.email = email;

    if (password && !confirmpassword) {
      res.status(422).json({
        message: 'A confirmação de senha é obrigatória.',
      });
      return;
    }

    if (confirmpassword && !password) {
      res.status(422).json({
        message: 'A senha é obrigatória.',
      });
      return;
    }

    if (password && confirmpassword && password !== confirmpassword) {
      res.status(422).json({
        message: 'A senha e a confirmação de senha precisam ser iguais.',
      });
      return;
    }

    if (password && confirmpassword && password === confirmpassword) {
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);
      user.password = passwordHash;
    }

    if (!phone) {
      res.status(422).json({ message: 'O número para contato é obrigatório' });
      return;
    }

    user.phone = phone;

    try {
      // returns update data
      await User.findOneAndUpdate(
        { _id: user.id },
        { $set: user },
        { new: true },
      );

      res.status(200).json({ message: 'Usuário atualizado com sucesso' });
    } catch (err) {
      res.status(500).json({ message: err });
      return;
    }
  }
};
