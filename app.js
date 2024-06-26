const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
require('dotenv').config();
const axios = require('axios');
const tmdbApiKey = process.env.TMDB_API_KEY;
const { addImagesAndYearsToMovies, searchMovieImage, searchMovieYear } = require('./tmdbAPI');
require('dotenv').config({ path: '.env.vercel' });;
const app = express();
const PORT = process.env.PORT || 3000;


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

const loadMovies = async () => {
    const data = await fs.readFile(path.join(__dirname, 'data', 'movies.json'), 'utf8');
    return JSON.parse(data);
};

const saveMovies = async (movies) => {
    await fs.writeFile(path.join(__dirname, 'data', 'movies.json'), JSON.stringify(movies, null, 2));
};

app.get('/', async (req, res) => {
    try {
        let movies = await loadMovies();
        // Utilizza la funzione addImagesAndYearsToMovies per aggiungere le immagini e gli anni ai film
        movies = await addImagesAndYearsToMovies(movies);
        res.render('index', { movies });
    } catch (error) {
        console.error('Error loading movies:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/api/movies', async (req, res) => {
    const { title, year } = req.body;
    try {
        let movies = await loadMovies();
        // Controllo se il film esiste già
        const movieExists = movies.some(movie => movie.title.toLowerCase() === title.toLowerCase());
        if (movieExists) {
            return res.status(400).json({ error: 'Movie already exists' });
        }

        const MovieYear = await searchMovieYear(title);
        const movieImage = await searchMovieImage(title);
        const newMovie = { title, year: MovieYear, image: movieImage || '/images/default.jpg', watched: false };

        movies.push(newMovie);
        await saveMovies(movies);
        res.status(200).send();
    } catch (error) {
        console.error('Error adding movie:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/api/movies/:title/watched', async (req, res) => {
    const { title } = req.params;
    try {
        let movies = await loadMovies();
        const movie = movies.find(movie => movie.title === title);
        if (movie) {
            movie.watched = !movie.watched;
            await saveMovies(movies);
            res.status(200).send();
        } else {
            res.status(404).send('Movie not found');
        }
    } catch (error) {
        console.error('Error updating movie:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/api/search', async (req, res) => {
    const { query } = req.query;
    try {
        const response = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
            params: {
                api_key: process.env.TMDB_API_KEY,
                query: query
            }
        });
        const titles = response.data.results.map(movie => movie.title);
        res.json(titles);
    } catch (error) {
        console.error('Error fetching movie titles:', error);
        res.status(500).send('Internal Server Error');
    }
});




app.delete('/api/movies/:title', async (req, res) => {
    const { title } = req.params;
    try {
        let movies = await loadMovies();
        movies = movies.filter(movie => movie.title !== title);
        await saveMovies(movies);
        res.status(200).send();
    } catch (error) {
        console.error('Error deleting movie:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 
