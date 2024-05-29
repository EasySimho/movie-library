// tmdbAPI.js

require('dotenv').config();
const axios = require('axios');

const tmdbApiKey = process.env.TMDB_API_KEY;
const searchMovieImage = async (title) => {
    try {
        const response = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
            params: {
                api_key: tmdbApiKey,
                query: title
            }
        });
        if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];
            return `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
        }
    } catch (error) {
        console.error(`Error fetching image for ${title}:`, error);
    }
    return null;
};

const addImagesAndYearsToMovies = async (movies) => {
    const moviesWithDetails = [];
    for (const movie of movies) {
        const image = await searchMovieImage(movie.title);
        const details = await getMovieDetails(movie.title); // Aggiunta della chiamata per ottenere i dettagli del film
        if (details) {
            moviesWithDetails.push({ ...movie, image, year: details.year }); // Aggiunta dell'anno ai dettagli del film
        } else {
            moviesWithDetails.push({ ...movie, image, year: null });
        }
    }
    return moviesWithDetails;
};


const searchMovieYear = async (title) => {
    try {
        const response = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
            params: {
                api_key: tmdbApiKey,
                query: title
            }
        });
        if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];
            return movie.release_date ? new Date(movie.release_date).getFullYear() : null;
        }
    } catch (error) {
        console.error(`Error fetching year for ${title}:`, error);
    }
    return null;
};



const getMovieDetails = async (title) => {
    try {
        const response = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
            params: {
                api_key: tmdbApiKey,
                query: title
            }
        });
        if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];
            return { year: movie.release_date ? new Date(movie.release_date).getFullYear() : null };
        }
    } catch (error) {
        console.error(`Error fetching details for ${title}:`, error);
    }
    return null;
};






module.exports = { searchMovieImage, addImagesAndYearsToMovies, searchMovieYear };
