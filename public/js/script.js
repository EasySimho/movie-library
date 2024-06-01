document
    .getElementById("add-movie-form")
    .addEventListener("submit", async function (event) {
        event.preventDefault();
        const title = document.getElementById("movie-title").value;
        const response = await fetch("/api/movies", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title }),
        });
        if (response.ok) {
            location.reload();
        } else {
            alert("Failed to add movie");
        }
    });

async function toggleWatched(title) {
    const response = await fetch(`/api/movies/${title}/watched`, {
        method: "POST",
    });
    if (response.ok) {
        location.reload();
    } else {
        alert("Failed to update movie status");
    }
}

async function deleteMovie(title) {
    const response = await fetch(`/api/movies/${title}`, {
        method: "DELETE",
    });
    if (response.ok) {
        location.reload();
    } else {
        alert("Failed to delete movie");
    }
}

const movieInput = document.getElementById("movie-title");
const suggestionsBox = document.getElementById("suggestions");
const addMovieButton = document.getElementById("add-film");
const errorMessage = document.getElementById("error-message");

movieInput.addEventListener("input", async () => {
    const query = movieInput.value;

    errorMessage.textContent = "";

    if (query.length > 2) {
        suggestionsBox.style.display = "initial";
        const response = await fetch(`/api/search?query=${query}`);
        const titles = await response.json();
        suggestionsBox.innerHTML = "";
        titles.forEach((title) => {
            const suggestion = document.createElement("div");
            suggestion.className = "suggestion list-group-item";
            suggestion.textContent = title;
            suggestion.addEventListener("click", () => {
                movieInput.value = title;
                suggestionsBox.innerHTML = "";
            });
            suggestionsBox.appendChild(suggestion);

            suggestion.addEventListener("mouseover", () => {
                suggestion.className = "suggestion list-group-item-secondary";
            });
            suggestion.addEventListener("mouseleave", () => {
                suggestion.className = "suggestion list-group-item";
            });
        });
    } else {
        suggestionsBox.style.display = "none";
    }
});

addMovieButton.addEventListener("click", async () => {
    const title = movieInput.value;
    const response = await fetch("/api/movies", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
    });
    if (response.ok) {
        errorMessage.innerHTML =
            '<div class="alert alert-success">Movie added successfully</div>';
    } else {
        const errorData = await response.json();
        errorMessage.innerHTML = `<div class="alert alert-danger">${errorData.error}</div>`;
    }
});



document.querySelectorAll('.card-img-top').forEach(image => {
    image.addEventListener('click', () => {
        const modal = document.getElementById('image-modal');
        const modalImage = document.getElementById('modal-image');

        modal.style.display = 'block';
        modalImage.src = image.src;
    });
});

document.querySelector('.close').addEventListener('click', () => {
    document.getElementById('image-modal').style.display = 'none';
});

// Close modal when clicking outside the image
document.getElementById('image-modal').addEventListener('click', (event) => {
    if (event.target == document.getElementById('image-modal')) {
        document.getElementById('image-modal').style.display = 'none';
    }
});