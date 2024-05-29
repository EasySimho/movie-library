const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const moviesFile = path.join(__dirname, '../data/movies.json');

// Read the TMDB API key from the environment variables
const tmdbApiKey = process.env.TMDB_API_KEY;

// Helper function to read movies from the JSON file
const readMovies = () => {
    const moviesData = fs.readFileSync(moviesFile);
    return JSON.parse(moviesData);
};

// Helper function to write movies to the JSON file
const writeMovies = (movies) => {
    fs.writeFileSync(moviesFile, JSON.stringify(movies, null, 2));
};

// Function to capitalize the first letter of each word in a string
const capitalizeTitle = (title) => {
    return title.replace(/\b\w/g, (char) => char.toUpperCase());
};

// Function to search for movie image and year using TMDB API
const searchMovieDetails = async (title) => {
    try {
        const response = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
            params: {
                api_key: tmdbApiKey,
                query: title
            }
        });

        if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];
            const imageUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
            const releaseYear = new Date(movie.release_date).getFullYear();
            return { imageUrl, releaseYear };
        }
    } catch (error) {
        console.error(`Error fetching details for ${title}:`, error);
    }
    return { imageUrl: null, releaseYear: 'N/A' };
};

app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
    const movies = readMovies();
    res.render(path.join(__dirname, '../views/index.ejs'), { movies });
});

app.post('/api/movies', async (req, res) => {
    const { title } = req.body;
    if (!title) {
        return res.status(400).send('Title is required');
    }

    const capitalizedTitle = capitalizeTitle(title);
    const { imageUrl, releaseYear } = await searchMovieDetails(capitalizedTitle);

    const movies = readMovies();
    if (movies.some(movie => movie.title.toLowerCase() === capitalizedTitle.toLowerCase())) {
        return res.status(409).send('Movie already exists');
    }

    const newMovie = {
        title: capitalizedTitle,
        year: releaseYear,
        image: imageUrl,
        watched: false
    };

    movies.push(newMovie);
    writeMovies(movies);
    res.status(201).send(newMovie);
});

app.post('/api/movies/:title/watched', (req, res) => {
    const { title } = req.params;
    const movies = readMovies();
    const movieIndex = movies.findIndex(movie => movie.title.toLowerCase() === title.toLowerCase());

    if (movieIndex === -1) {
        return res.status(404).send('Movie not found');
    }

    movies[movieIndex].watched = !movies[movieIndex].watched;
    writeMovies(movies);
    res.status(200).send(movies[movieIndex]);
});

app.delete('/api/movies/:title', (req, res) => {
    const { title } = req.params;
    const movies = readMovies();
    const movieIndex = movies.findIndex(movie => movie.title.toLowerCase() === title.toLowerCase());

    if (movieIndex === -1) {
        return res.status(404).send('Movie not found');
    }

    const deletedMovie = movies.splice(movieIndex, 1);
    writeMovies(movies);
    res.status(200).send(deletedMovie);
});

module.exports = app;
