let currentGenreId = null;
let currentGenreName = "";
let currentGenrePage = 1;

document.addEventListener("DOMContentLoaded", async function () {
    const params = new URLSearchParams(window.location.search);
    const genreId = params.get("id");
    const genreName = params.get("name") || "Genre";

    if (!genreId) {
        showGenreError("Genre not found.");
        return;
    }

    currentGenreId = Number(genreId);
    currentGenreName = decodeURIComponent(genreName);
    currentGenrePage = 1;

    document.getElementById("genrePageTitle").textContent = currentGenreName;

    await loadGenreSidebar();
    await loadGenreMovies(currentGenreId, currentGenreName, 1);
});


async function loadGenreSidebar() {
    const list = document.getElementById("genreSidebarList");

    try {
        const genres = await getGenres();

        list.innerHTML = "";

        genres.forEach(function (genre) {
            const link = document.createElement("a");
            link.href = `genre.html?id=${genre.id}&name=${encodeURIComponent(genre.name)}`;
            link.className = "genre-sidebar-item";
            link.textContent = genre.name;

            if (Number(genre.id) === currentGenreId) {
                link.classList.add("active");
            }

            list.appendChild(link);
        });

    } catch (error) {
        console.error("Failed to load genres sidebar:", error);
        list.innerHTML = "<p style='color:#999;padding:10px;'>Unable to load genres</p>";
    }
}

async function loadGenreMovies(genreId, genreName, page = 1) {
    const status = document.getElementById("genreStatus");
    const list = document.getElementById("genreMoviesList");
    const pagination = document.getElementById("genrePagination");
    const countEl = document.getElementById("genreMovieCount");

    status.classList.remove("hidden");
    status.textContent = "Loading movies...";
    list.innerHTML = "";
    pagination.innerHTML = "";

    try {
        const { movies, totalCount } = await fetchDoublePage(
            getMoviesByGenre,
            page,
            genreId
        );

        if (movies.length === 0) {
            status.textContent = "No movies found for this genre.";
            countEl.textContent = "";
            return;
        }

        status.classList.add("hidden");
        countEl.textContent = totalCount ? `${totalCount} titles` : "";

        displayGenreMovies(movies);

        const totalPages = Math.ceil(totalCount / 20) || 1;
        createGenrePagination(page, totalPages);
    } catch (error) {
        console.error(error);
        status.textContent = error.message || "Unable to load genre movies.";
        countEl.textContent = "";
    }
}

function displayGenreMovies(movies) {
    const list = document.getElementById("genreMoviesList");
    list.innerHTML = "";

    movies.forEach(function (movie) {
        const item = document.createElement("article");
        item.className = "genre-movie-item";

        const posterLink = document.createElement("a");
        posterLink.href = `details.html?id=${movie.id}`;
        posterLink.className = "genre-movie-poster-wrap";

        const poster = document.createElement("img");
        poster.className = "genre-movie-poster";
        poster.src = movie.poster || "";
        poster.alt = `${movie.title} poster`;
        posterLink.appendChild(poster);

        const info = document.createElement("div");
        info.className = "genre-movie-info";

        const title = document.createElement("a");
        title.href = `details.html?id=${movie.id}`;
        title.className = "genre-movie-title";
        title.textContent = movie.title;

        const meta = document.createElement("div");
        meta.className = "genre-movie-meta";
        const year = movie.year || "";
        const rated = movie.rated || "";
        const runtime = movie.runtime || "";

        const metaParts = [year, rated, runtime].filter(Boolean);
        meta.textContent = metaParts.join(" • ");

        const tags = document.createElement("div");
        tags.className = "genre-movie-tags";

        let genreList = [];
        if (Array.isArray(movie.genres) && movie.genres.length > 0) {
            genreList = movie.genres.map(g => g.name || g);
        } else if (typeof movie.genres === "string" && movie.genres) {
            genreList = movie.genres.split(",").map(s => s.trim());
        }

        genreList.slice(0, 4).forEach(function (g) {
            const tag = document.createElement("span");
            tag.className = "genre-tag";
            tag.textContent = g;
            tags.appendChild(tag);
        });

        const plot = document.createElement("p");
        plot.className = "genre-movie-plot";
        plot.textContent = movie.plot || movie.summary || "";

        const credits = document.createElement("div");
        credits.className = "genre-movie-credits";

        if (movie.director) {
            const dir = document.createElement("p");
            dir.innerHTML = `<strong>Director:</strong> ${movie.director}`;
            credits.appendChild(dir);
        }
        if (movie.actors) {
            const stars = document.createElement("p");
            stars.innerHTML = `<strong>Stars:</strong> ${movie.actors}`;
            credits.appendChild(stars);
        }

        if (movie.imdb_votes || movie.votes) {
            const votes = document.createElement("p");
            votes.className = "genre-movie-votes";
            votes.textContent = `Votes: ${movie.imdb_votes || movie.votes}`;
            credits.appendChild(votes);
        }

        info.appendChild(title);
        if (metaParts.length) info.appendChild(meta);
        if (genreList.length) info.appendChild(tags);
        if (plot.textContent) info.appendChild(plot);
        info.appendChild(credits);

        const ratingBox = document.createElement("div");
        ratingBox.className = "genre-movie-rating";
        ratingBox.innerHTML = `
            <span class="rating-star">★</span>
            <span class="rating-value">${movie.imdb_rating || "N/A"}</span>
        `;

        item.appendChild(posterLink);
        item.appendChild(info);
        item.appendChild(ratingBox);

        list.appendChild(item);
    });
}

function createGenrePagination(current, total) {
    const pagination = document.getElementById("genrePagination");
    pagination.innerHTML = "";

    if (total <= 1) return;

    const prev = document.createElement("button");
    prev.className = "pagination-arrow";
    prev.textContent = "‹";
    prev.disabled = current === 1;
    prev.addEventListener("click", function () {
        if (current > 1) changeGenrePage(current - 1);
    });
    pagination.appendChild(prev);

    const pages = [];
    if (total <= 7) {
        for (let p = 1; p <= total; p++) pages.push(p);
    } else {
        pages.push(1);
        if (current > 4) pages.push("...");
        const start = Math.max(2, current - 1);
        const end = Math.min(total - 1, current + 1);
        for (let p = start; p <= end; p++) pages.push(p);
        if (current < total - 3) pages.push("...");
        pages.push(total);
    }

    pages.forEach(function (page) {
        if (page === "...") {
            const dots = document.createElement("span");
            dots.className = "pagination-dots";
            dots.textContent = "...";
            pagination.appendChild(dots);
            return;
        }

        const btn = document.createElement("button");
        btn.className = "pagination-number";
        btn.textContent = page;
        if (page === current) btn.classList.add("active");
        btn.addEventListener("click", function () {
            changeGenrePage(page);
        });
        pagination.appendChild(btn);
    });

    const next = document.createElement("button");
    next.className = "pagination-arrow";
    next.textContent = "›";
    next.disabled = current === total;
    next.addEventListener("click", function () {
        if (current < total) changeGenrePage(current + 1);
    });
    pagination.appendChild(next);
}


function changeGenrePage(page) {
    currentGenrePage = page;
    loadGenreMovies(currentGenreId, currentGenreName, page);

    document.querySelector(".genre-content")?.scrollIntoView({ behavior: "smooth" });
}


function showGenreError(message) {
    const status = document.getElementById("genreStatus");
    status.classList.remove("hidden");
    status.textContent = message;
}