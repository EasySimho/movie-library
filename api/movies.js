const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const moviesFile = path.join(__dirname, '../data/movies.json');

// Leggi la chiave API di TMDB dalle variabili di ambiente
const tmdbApiKey = process.env.TMDB_API_KEY;

// Funzione helper per leggere i film dal file JSON
const readMovies = () => {
    const moviesData = fs.readFileSync(moviesFile);
    return JSON.parse(moviesData);
};

// Funzione helper per scrivere i film nel file JSON
const writeMovies = (movies) => {
    fs.writeFileSync(moviesFile, JSON.stringify(movies, null, 2));
};

// Funzione per capitalizzare la prima lettera di ogni parola in una stringa
const capitalizeTitle = (title) => {
    return title.replace(/\b\w/g, (char) => char.toUpperCase());
};

// Funzione per cercare immagine e anno del film usando l'API TMDB
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
    try {
        const movies = readMovies();
        res.render(path.join(__dirname, '../views/index.ejs'), { movies });
    } catch (error) {
        console.error('Error rendering index page:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/api/movies', async (req, res) => {
    try {
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
    } catch (error) {
        console.error('Error adding movie:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/api/movies/:title/watched', (req, res) => {
    try {
        const { title } = req.params;
        const movies = readMovies();
        const movieIndex = movies.findIndex(movie => movie.title.toLowerCase() === title.toLowerCase());

        if (movieIndex === -1) {
            return res.status(404).send('Movie not found');
        }

        movies[movieIndex].watched = !movies[movieIndex].watched;
        writeMovies(movies);
        res.status(200).send(movies[movieIndex]);
    } catch (error) {
        console.error(`Error updating watched status for ${title}:`, error);
        res.status(500).send('Internal Server Error');
    }
});

app.delete('/api/movies/:title', (req, res) => {
    try {
        const { title } = req.params;
        const movies = readMovies();
        const movieIndex = movies.findIndex(movie => movie.title.toLowerCase() === title.toLowerCase());

        if (movieIndex === -1) {
            return res.status(404).send('Movie not found');
        }

        const deletedMovie = movies.splice(movieIndex, 1);
        writeMovies(movies);
        res.status(200).send(deletedMovie);
    } catch (error) {
        console.error(`Error deleting movie ${title}:`, error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = app;
