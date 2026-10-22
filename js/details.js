document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const movieId = params.get("id");

    if (!movieId) {
        showError("Movie ID was not found.");
        return;
    }

    loadMovieDetails(movieId);
});

async function loadMovieDetails(movieId) {
    const status = document.getElementById("detailsStatus");
    const detailsContainer = document.getElementById("movieDetails");

    try {
        status.textContent = "Loading movie...";

        const movie = await getMovieDetails(movieId);
        displayMovieDetails(movie);

        status.classList.add("hidden");
        detailsContainer.classList.remove("hidden");
    } catch (error) {
        console.error(error);
        showError("Unable to load movie details.");
    }
}

function displayMovieDetails(movie) {
    const detailsContainer = document.getElementById("movieDetails");

    const genres = movie.genres || [];
    const scenes = movie.images || [];

    const actors = movie.actors
        ? movie.actors
              .split(",")
              .map((actor) => actor.trim())
              .filter(Boolean)
              .slice(0, 4) : [];

    const genreTags = genres
        .map((g) => {
            const name = typeof g === "object" ? g.name || g : g;
            return `<span class="genre-tag">${name}</span>`;
        })
        .join("");

    detailsContainer.innerHTML = `
        <!-- Movie information -->
        <div class="movie-info-layout">
            <!-- Left side: poster -->
            <div class="poster-column">
                <h1 class="details-title">${movie.title}</h1>

                <div class="details-meta">
                    <span>${movie.year || "Unknown"}</span>
                    <span>•</span>
                    <span>${movie.rated || "N/A"}</span>
                    <span>•</span>
                    <span>${movie.runtime || "Unknown"}</span>
                </div>

                <img
                    class="details-poster"
                    src="${movie.poster}"
                    alt="${movie.title}"
                >
            </div>

            <!-- Right side: movie information -->
            <div class="details-content">
                <!-- Rating -->
                <div class="details-rating">
                    ⭐ ${movie.imdb_rating || "N/A"} / 10
                </div>

                <!-- Genres -->
                <div class="details-section-block">
                    <h3>Genres</h3>
                    <div class="movie-genres">
                        ${genreTags}
                    </div>
                </div>

                <!-- Plot -->
                <div class="details-section-block">
                    <h3>Plot</h3>
                    <p>${movie.plot || "No description available."}</p>
                </div>

                <!-- Director -->
                <div class="details-section-block">
                    <h3>Director</h3>
                    <p>${movie.director || "Unknown"}</p>
                </div>

                <!-- Writers -->
                <div class="details-section-block">
                    <h3>Writers</h3>
                    <p>${movie.writer || "Unknown"}</p>
                </div>

                <!-- Stars -->
                <div class="details-section-block">
                    <h3>Stars</h3>
                    <p>${movie.actors || "Unknown"}</p>
                </div>

                <!-- Movie scenes -->
                <div class="movie-scenes">
                    ${scenes
                        .slice(0, 3)
                        .map(
                            (image) => `
                        <img
                            src="${image}"
                            alt="${movie.title} scene"
                        >
                    `
                        )
                        .join("")}
                </div>
            </div>
        </div>

        <!-- Cast -->
        <section class="cast-section">
            <h2>
                <span class="cast-dot"></span>
                CAST
            </h2>
            <div class="cast-grid">
                ${actors
                    .map(
                        (actor) => `
                    <div class="cast-card">
                        <div class="cast-image">
                            <div class="cast-placeholder">
                                ${actor.charAt(0)}
                            </div>
                        </div>
                        <div class="cast-info">
                            <h3>${actor}</h3>
                            <p>Cast member</p>
                        </div>
                    </div>
                `
                    )
                    .join("")}
            </div>
        </section>
    `;
}

function showError(message) {
    const status = document.getElementById("detailsStatus");
    status.textContent = message;
    status.classList.remove("hidden");
}