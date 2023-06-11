const fs = require('fs')
const { validationResult } = require("express-validator");
// const Getgeolocation = require('../utils/location')
const HttpError = require("../models/htttp-error");
const Place = require('../models/place');
const User = require('../models/user');
const mongoose = require("mongoose");




const getPlaces = async (req, res, next) => {
  let places;
  try {
    places = await Place.find({})
  } catch (err) {
    const error = new HttpError('could not fetch place', 501)
    return next(error)
  }

  if(!places){
    return next(new HttpError('No places is found, you might like to create one'))
  }
  res.status(200).json({
    places : places.map((place) => place.toObject({getters: true}))
  });

}

const getPlacesById =  async (req, res, next) => {
  const placeId = req.params.pid;
  let place; 
  try {
    place = await Place.findById(placeId)
  } catch (err) {
    const error = new HttpError('could not find place');
    return next(error);
  }
  if (!place) {
    const error = new HttpError('could not find a place for the provided user Id', 404);
    return next(error);
  } else {
    res.json({
      place: place.toObject({getters: true})
    });
  }
};

const getPlacesByUserId  = async (req, res, next) => {
  const userId = req.params.uid;
  let userWithplaces; 
  try {
    userWithplaces = await User.findById(userId).populate('places');
  } catch (err) {
    const error = new HttpError('Fetching places failed, please try again later',500);
    return next(error);
  }
  if (!userWithplaces || userWithplaces.places.length === 0) {
    return next(new HttpError("Could not find any places for the provided user id", 404));
  } else {
    res.json({
      places: userWithplaces.places.map(place => place.toObject({getters: true}))
    });
  }
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Input can not be empty,check your data", 422)) ;
  };
  // let coordinates;
  // try {
  //   coordinates = await Getgeolocation(address)
  // } catch (error) {
  //   return next(error);
  // }
  const { title, description, address, creator } = req.body;
  const createdPlace = new Place({
    title,
    description,
    address,
    image: req.file.path,
    creator
  });

  let user;
  try {
    user = await User.findById(creator)
  } catch (err) {
    const error = new HttpError('creating place failed, please try again later', 500);
    return next(error)
  };

  if(!user){
    return next('could not find user for the provided user id', 404)
  }

 
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({session: sess});
    user.places.push(createdPlace);
    await user.save({session: sess})
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError('could not save place, please try again later', 500);
    return next(error)
  }
  
  res.status(201).json({
    place: createdPlace
  });
};

const updatePlaceById = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError("Input can not be empty,check your data", 422);
  }
  const { title, description } = req.body;
  const placeId = req.params.pid

  let place;
  try {
    place = await Place.findById(placeId)
  } catch (err) {
    const error = new HttpError('could not find place, please try again later', 501)
    return next(error)
  };

  place.title = title;
  place.description = description;
  try {
    await place.save()
  } catch (err) {
    const error = new HttpError('could not save place, please try again later', 501)
    return next(error)
  }
  res.status(200).json({ place: place.toObject({getters: true}) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  

  let place;
  try {
    place = await Place.findById(placeId).populate('creator');
  } catch(err) {
    return next(new HttpError('could not find place', 404))
  }

  const imagePath = place.image;

  if(!place) {
    return next(new HttpError('could not find place for the provided place id', 404))
  }
  
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.deleteOne({session: sess});
    place.creator.places.pull(place);
    await place.creator.save({session: sess});
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError('could not delete place, something went wrong', 500);
    return next(error)
  }
  
  fs.unlink(imagePath, err => {
    console.log(err);
  })
  res.status(200).json({
    message: "Place id deleted",
  });
};

exports.getPlaces = getPlaces;
exports.getPlacesById = getPlacesById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlaceById = updatePlaceById;
exports.deletePlace = deletePlace;
