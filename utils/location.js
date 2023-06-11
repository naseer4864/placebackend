// const axios = require('axios')
// const HttpError = require('../models/http-error');

// const API_KEY = '33ujdi8oskd098r8u4bnme d84475uuhsdbs6bde';

// async function getGeoLocation(address) {
//     const res = await axios.get(`'https://www.gps-coordinates.net/my-location'${encodeURIComponent(location)}&KEY=${API_KEY}`)
//     const data = data.res = data;

//     if(!data || data.status === 'ZERO_RESULT') {
//         const error = new HttpError('Could not find location for the provided address', 422);
//         throw error
//     };

//     let coordenates = data.results[0].geometry.location

//     return coordenates;

// };

// module.exports = getGeoLocation;