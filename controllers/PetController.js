const { ObjectId } = require('mongoose').Types;
const Pet = require('../models/Pet');

// Helpers
const getToken = require('../helpers/get-token');
const getUserByToken = require('../helpers/get-user-by-token');

module.exports = class PetController {
  static async create(req, res) {
    const { name, age, weight, color } = req.body;
    const available = true;

    // Images upload
    const images = req.files;

    // Validation
    if (!name) {
      res.status(422).json({ message: 'O nome é obrigatório!' });
      return;
    }

    if (!age) {
      res.status(422).json({ message: 'A idade é obrigatória!' });
      return;
    }

    if (!weight) {
      res.status(422).json({ message: 'O peso é obrigatório!' });
      return;
    }

    if (!color) {
      res.status(422).json({ message: 'A cor é obrigatória!' });
      return;
    }

    if (images.length === 0) {
      res.status(422).json({ message: 'A imagem é obrigatória!' });
      return;
    }

    // Get pet owner
    const token = getToken(req);
    const user = await getUserByToken(token);

    // Create a pet
    const pet = new Pet({
      name,
      age,
      weight,
      color,
      available,
      images: [],
      user: {
        _id: user._id,
        name: user.name,
        image: user.image,
        phone: user.phone,
      },
    });

    images.forEach((image) => pet.images.push(image.filename));

    try {
      const newPet = await pet.save();
      res.status(201).json({
        message: 'Pet cadastrado com sucesso',
        newPet,
      });
    } catch (err) {
      res.status(500).json({ message: err });
      return;
    }
  }

  static async getAll(req, res) {
    const pets = await Pet.find().sort('-createdAt');
    res.status(200).json(pets);
  }

  static async getAllUserPets(req, res) {
    // Get user from token
    const token = getToken(req);
    const user = await getUserByToken(token);

    const pets = await Pet.find({ 'user._id': user._id }).sort('-createdAt');

    res.status(200).json(pets);
  }

  static async getAllUserAdoptions(req, res) {
    // Get user from token
    const token = getToken(req);
    const user = await getUserByToken(token);

    const pets = await Pet.find({ 'adopter._id': user._id }).sort('-createdAt');

    res.status(200).json(pets);
  }

  static async getPetById(req, res) {
    const { id } = req.params;

    // Check if id is valid
    if (!ObjectId.isValid(id)) {
      res.status(422).json({ message: 'ID inválido!' });
      return;
    }

    // Get pet by id
    const pet = await Pet.findOne({ _id: id });

    if (!pet) {
      res.status(404).json({ message: 'Pet não encontrado!' });
      return;
    }

    res.status(200).json(pet);
  }

  static async removePetById(req, res) {
    const { id } = req.params;

    // Check if id is valid
    if (!ObjectId.isValid(id)) {
      res.status(422).json({ message: 'ID inválido!' });
      return;
    }

    // Get pet by id
    const pet = await Pet.findOne({ _id: id });

    if (!pet) {
      res.status(404).json({ message: 'Pet não encontrado!' });
      return;
    }

    // Check if logged in user registered the pet
    const token = getToken(req);
    const user = await getUserByToken(token);

    if (pet.user._id.toString() !== user._id.toString()) {
      res
        .status(422)
        .json({ message: 'Houve um problema, tente novamente mais tarde!' });

      return;
    }

    try {
      await Pet.findByIdAndRemove(id);
      res.status(200).json({ message: 'Pet removido com sucesso!' });
    } catch (error) {
      res
        .status(422)
        .json({ message: 'Houve um problema, tente novamente mais tarde!' });

      return;
    }
  }

  static async updatePet(req, res) {
    const { id } = req.params;

    const { name, age, weight, color, available } = req.body;

    // Images upload
    const images = req.files;

    const updatedData = {};

    // Check if pet exists
    const pet = await Pet.findOne({ _id: id });

    if (!pet) {
      res.status(404).json({ message: 'Pet não encontrado!' });
      return;
    }

    // Check if logged in user registered the pet
    const token = getToken(req);
    const user = await getUserByToken(token);

    if (pet.user._id.toString() !== user._id.toString()) {
      res
        .status(422)
        .json({ message: 'Houve um problema, tente novamente mais tarde!' });

      return;
    }

    // Validation
    if (!name) {
      res.status(422).json({ message: 'O nome é obrigatório!' });
      return;
    }

    updatedData.name = name;

    if (!age) {
      res.status(422).json({ message: 'A idade é obrigatória!' });
      return;
    }

    updatedData.age = age;

    if (!weight) {
      res.status(422).json({ message: 'O peso é obrigatório!' });
      return;
    }

    updatedData.weight = weight;

    if (!color) {
      res.status(422).json({ message: 'A cor é obrigatória!' });
      return;
    }

    updatedData.color = color;

    if (images.length > 0) {
      updatedData.images = [];
      images.forEach((image) => updatedData.images.push(image.filename));
    }

    if (!available) {
      res.status(422).json({ message: 'O status é obrigatório!' });
      return;
    }
    updatedData.available = available;

    try {
      await Pet.findByIdAndUpdate(id, updatedData);
      res.status(200).json({ message: 'Pet atualizado com sucesso!' });
    } catch (error) {
      res
        .status(422)
        .json({ message: 'Houve um problema, tente novamente mais tarde!' });

      return;
    }
  }

  static async schedule(req, res) {
    const { id } = req.params;

    // Check if pet exists
    const pet = await Pet.findOne({ _id: id });

    if (!pet) {
      res.status(404).json({ message: 'Pet não encontrado!' });
      return;
    }

    // Check if user registered the pet
    const token = getToken(req);
    const user = await getUserByToken(token);

    if (pet.user._id.equals(user._id)) {
      res.status(422).json({
        message: 'Você não pode agendar uma visita para o seu próprio pet!',
      });

      return;
    }

    // Check if user has already scheduled a visit
    if (pet.adopter && pet.adopter._id.equals(user._id)) {
      res.status(422).json({
        message: 'Você já agendou uma visita para este pet!',
      });

      return;
    }

    // add user to pet
    pet.adopter = {
      _id: user._id,
      name: user.name,
      image: user.image,
    };

    try {
      await Pet.findByIdAndUpdate(id, pet);
      res.status(200).json({
        message: `A visita foi agendada com sucesso! Entre em contato com ${pet.user.name} pelo contato ${pet.user.phone}.`,
      });
    } catch (error) {
      res
        .status(422)
        .json({ message: 'Houve um problema, tente novamente mais tarde!' });

      return;
    }
  }

  static async concludeAdoption(req, res) {
    const { id } = req.params;

    // Check if pet exists
    const pet = await Pet.findOne({ _id: id });

    if (!pet) {
      res.status(404).json({ message: 'Pet não encontrado!' });
      return;
    }

    const token = getToken(req);
    const user = await getUserByToken(token);

    if (pet.user._id.toString() !== user._id.toString()) {
      res
        .status(422)
        .json({ message: 'Houve um problema, tente novamente mais tarde!' });

      return;
    }

    pet.available = false;

    try {
      await Pet.findByIdAndUpdate(id, pet);
      res
        .status(200)
        .json({ message: 'Parabéns, a adoção foi finalizada com sucesso!' });
    } catch (error) {
      res
        .status(422)
        .json({ message: 'Houve um problema, tente novamente mais tarde!' });

      return;
    }
  }
};
