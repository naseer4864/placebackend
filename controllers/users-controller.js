const { validationResult } = require("express-validator");
const HttpError = require("../models/htttp-error");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const getUser = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (err) {
    const error = new HttpError(
      "could  not get all users please try again later",
      501
    );
    return next(error);
  }
  res.status(200).json({
    users: users.map((user) => user.toObject({ getters: true })),
  });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Input can not be empty,", 422));
  }
  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later",
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      "User exists already, please login instaed.",
      501
    );
    return next(error);
  }

  let hashedPassword;

  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError("Could not create user, please try again", 500);
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    password: hashedPassword,
    image: req.file.path,
    places: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError("could not store User", 501);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      "suppersecret_dont_share",
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError("Signing up failed, please try again", 500);
    return next(error);
  }

  res.status(200).json({
    userId: createdUser.id,
    email: createdUser.email,
    token: token,
  });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  let idententifiedUser;

  try {
    idententifiedUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("could not fetch user", 422);
    return next(error);
  }

  if (!idententifiedUser) {
    return next(
      new HttpError("Invalid credential, email or password is not correct", 501)
    );
  }

  let isValidPassword;
  try {
    isValidPassword = await bcrypt.compare(
      password,
      idententifiedUser.password
    );
  } catch (err) {
    const error = new HttpError(
      "Could not log you in, please check your credential and try again",
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      "Could not log you in, please check your credential and try again",
      500
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: idententifiedUser.id, email: idententifiedUser.email },
      "suppersecret_dont_share",
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError("Logging in failed, please try again", 500);
    return next(error);
  }

  res.status(200).json({
    userId: idententifiedUser.id,
    email: idententifiedUser.email,
    token: token,
  });
};

exports.getUser = getUser;
exports.signup = signup;
exports.login = login;