
const searchForm =
    document.getElementById("searchForm");

const searchInput =
    document.getElementById("searchInput");

const genreButton =
    document.getElementById("genreButton");

const genreDropdown =
    document.querySelector(".genre-dropdown");

const genreOptions =
    document.querySelectorAll(".genre-option");

const moviesGrid =
    document.getElementById("moviesGrid");

const statusMessage =
    document.getElementById("statusMessage");

const sectionTitle =
    document.getElementById("sectionTitle");

const pagination =
    document.getElementById("pagination");

const searchSuggestions =
    document.getElementById("searchSuggestions");

let searchTimer;
let searchRequestNumber = 0;


let currentPage = 1;
let currentSearch = "";
let currentGenre = null;


document.addEventListener(
    "DOMContentLoaded",
    async function () {

        if (moviesGrid && statusMessage) {
            const params = new URLSearchParams(window.location.search);
            const q = params.get("q");

            if (q) {
                searchInput.value = q;
                currentSearch = q;
                currentGenre = null;
                currentPage = 1;
                
                const banner = document.getElementById("featuredBanner");
                if (banner) banner.classList.add("hidden");
                await performSearch(q, 1);
            } else {
                await loadHomeMovies(1);
                await loadFeaturedBanner();
            }
        }

    }
);


let featuredMovies = [];
let featuredIndex = 0;
let featuredTimer = null;

async function loadFeaturedBanner() {
    const banner = document.getElementById("featuredBanner");
    if (!banner) return;

    try {
        const result = await getMovies(1);
        const list = (result.data || []).slice(0, 5);

        if (list.length === 0) {
            banner.classList.add("hidden");
            return;
        }

        featuredMovies = await Promise.all(
            list.map((m) => getMovieDetails(m.id).catch(() => m))
        );

        const dotsContainer = document.getElementById("featuredDots");
        dotsContainer.innerHTML = "";

        featuredMovies.forEach((_, i) => {
            const dot = document.createElement("button");
            dot.className = "featured-dot" + (i === 0 ? " active" : "");
            dot.addEventListener("click", () => {
                showFeaturedSlide(i);
                resetFeaturedTimer();
            });
            dotsContainer.appendChild(dot);
        });

        document.getElementById("featuredPrev")?.addEventListener("click", () => {
            const prev = (featuredIndex - 1 + featuredMovies.length) % featuredMovies.length;
            showFeaturedSlide(prev);
            resetFeaturedTimer();
        });

        document.getElementById("featuredNext")?.addEventListener("click", () => {
            const next = (featuredIndex + 1) % featuredMovies.length;
            showFeaturedSlide(next);
            resetFeaturedTimer();
        });

        showFeaturedSlide(0);
        startFeaturedTimer();
    } catch (error) {
        console.error("Featured banner error:", error);
        banner.classList.add("hidden");
    }
}

function showFeaturedSlide(index) {
    if (!featuredMovies.length) return;

    featuredIndex = index;
    const movie = featuredMovies[index];

    const bg = document.getElementById("featuredBg");
    const bgImage = (movie.images && movie.images[0]) || movie.poster || "";
    bg.style.backgroundImage = bgImage ? `url('${bgImage}')` : "none";

    document.getElementById("featuredTitle").textContent = movie.title || "";

    const genresBox = document.getElementById("featuredGenres");
    genresBox.innerHTML = "";

    let genreList = [];
    if (Array.isArray(movie.genres) && movie.genres.length) {
        genreList = movie.genres.map((g) => g.name || g);
    } else if (typeof movie.genres === "string" && movie.genres) {
        genreList = movie.genres.split(",").map((s) => s.trim());
    }

    genreList.slice(0, 4).forEach((g) => {
        const tag = document.createElement("span");
        tag.className = "featured-genre-tag";
        tag.textContent = g;
        genresBox.appendChild(tag);
    });

    const plotEl = document.getElementById("featuredPlot");
    if (plotEl) {
        const fullPlot = movie.plot || movie.summary || "";
        plotEl.textContent =
            fullPlot.length > 200 ? fullPlot.slice(0, 200).trim() + "..." : fullPlot;
    }

    document.querySelectorAll(".featured-dot").forEach((dot, i) => {
        dot.classList.toggle("active", i === index);
    });
}

function startFeaturedTimer() {
    clearInterval(featuredTimer);
    featuredTimer = setInterval(() => {
        const next = (featuredIndex + 1) % featuredMovies.length;
        showFeaturedSlide(next);
    }, 6000);
}

function resetFeaturedTimer() {
    startFeaturedTimer();
}

function showLoading() {

    statusMessage.classList.remove("hidden");

    statusMessage.textContent =
        "Loading movies...";

    moviesGrid.innerHTML = "";

    pagination.innerHTML = "";
}

function showError(message) {

    statusMessage.classList.remove("hidden");

    statusMessage.textContent =
        message;

    moviesGrid.innerHTML = "";

    pagination.innerHTML = "";
}

function hideStatus() {

    statusMessage.classList.add("hidden");

}

async function loadHomeMovies(page = 1) {
    showLoading();

    try {
        const { movies, firstPage } = await fetchDoublePage(getMovies, page);

        if (movies.length === 0) {
            showError("No movies found.");
            return;
        }

        hideStatus();
        displayMovies(movies);

        const apiPageCount = Number(firstPage.metadata?.page_count || 1);
        const totalPages = Math.ceil(apiPageCount / 2);

        createPagination(page, totalPages);
    } catch (error) {
        showError(error.message || "Unable to load movies.");
        console.error(error);
    }
}

if (searchInput) {
searchInput.addEventListener("input", function () {

    clearTimeout(searchTimer);

    const query = searchInput.value.trim();

    if (query.length < 2) {
        if (searchSuggestions) {
            searchSuggestions.innerHTML = "";
            searchSuggestions.classList.add("hidden");
        }
        return;
    }

    searchTimer = setTimeout(function () {
        showSearchSuggestions(query);
    }, 300);

});
}


async function showSearchSuggestions(query) {

    const requestNumber = ++searchRequestNumber;

    try {
        const result = await searchMovies(query, 1);

        if (requestNumber !== searchRequestNumber) {
            return;
        }

        if (searchInput.value.trim() !== query) {
            return;
        }

        const movies = result.data || [];

        searchSuggestions.innerHTML = "";

        if (movies.length === 0) {
            searchSuggestions.classList.add("hidden");
            return;
        }

        movies.slice(0, 5).forEach(function (movie) {

            const item = document.createElement("a");
            item.className = "search-suggestion";
            item.href = `details.html?id=${movie.id}`;

            const poster = document.createElement("img");
            poster.src = movie.poster || "";
            poster.alt = `${movie.title} poster`;

            const info = document.createElement("div");
            info.className = "search-suggestion-info";

            const title = document.createElement("p");
            title.textContent = movie.title;

            const year = document.createElement("span");
            year.textContent = movie.year || "Year unknown";

            info.appendChild(title);
            info.appendChild(year);

            item.appendChild(poster);
            item.appendChild(info);

            searchSuggestions.appendChild(item);

        });

        searchSuggestions.classList.remove("hidden");

    } catch (error) {

        console.error("Search suggestions failed:", error);
        searchSuggestions.classList.add("hidden");

    }

}

document.addEventListener("click", function (event) {

    if (!event.target.closest(".search-container")) {
        searchSuggestions.classList.add("hidden");
    }

});


if (searchForm) {
searchForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        clearTimeout(searchTimer);
        searchRequestNumber++;
        if (searchSuggestions) searchSuggestions.classList.add("hidden");

        const query =
            searchInput.value.trim();


        if (!query) {

            return;

        }

        if (!moviesGrid) {
            window.location.href = `index.html?q=${encodeURIComponent(query)}`;
            return;
        }

        currentSearch = query;

        currentGenre = null;

        currentPage = 1;

        await performSearch( query, 1 );

    }
);
}


async function performSearch(query, page = 1) {

    const banner = document.getElementById("featuredBanner");
    if (banner) banner.classList.add("hidden");

    showLoading();

    try {
        const { movies, totalCount } = await fetchDoublePage(
            searchMovies,
            page,
            query
        );

        if (movies.length === 0) {
            showError("No movies found.");
            return;
        }

        hideStatus();
        sectionTitle.textContent = `Results for: ${query}`;
        displayMovies(movies);

        const totalPages = Math.ceil(totalCount / 20);
        createPagination(page, totalPages);
    } catch (error) {
        showError(error.message || "Something went wrong while searching.");
        console.error(error);
    }
}

if (genreButton && genreDropdown) {
genreButton.addEventListener(
    "click",
    function () {

        genreDropdown.classList.toggle(
            "open"
        );

    }
);
}

genreOptions.forEach(
    function (option) {

        option.addEventListener(
            "click",
            async function () {

                const genre =
                    option.dataset.genre;


                genreButton.querySelector(
                    "span"
                ).textContent =
                    genre;


                genreDropdown.classList.remove(
                    "open"
                );

                const genres =
                    await getGenres();


                const selectedGenre =
                    genres.find(
                        function (item) {
                            return (
                                item.name.toLowerCase() ===
                                genre.toLowerCase()
                            );

                        }
                    );

                if (!selectedGenre) {
                    showError(
                        "Genre not found."
                    );
                    return;
                }

                window.location.href =
                    `genre.html?id=${selectedGenre.id}&name=${encodeURIComponent(genre)}`;

            }
        );

    }
);


async function filterMoviesByGenre(genreId, genreName, page = 1) {
    showLoading();

    try {
        const { movies, totalCount } = await fetchDoublePage(
            getMoviesByGenre,
            page,
            genreId
        );

        if (movies.length === 0) {
            showError("No movies found for this genre.");
            return;
        }

        hideStatus();
        sectionTitle.textContent = `Results for ${genreName} movies`;
        displayMovies(movies);

        const totalPages = Math.ceil(totalCount / 20);
        createPagination(page, totalPages);
    } catch (error) {
        showError(error.message || "Unable to load genre movies.");
        console.error(error);
    }
}

function displayMovies(movies) {

    moviesGrid.innerHTML = "";

    movies.forEach(function (movie) {

        const card = document.createElement("article");
        card.className = "movie-card";

        const poster = document.createElement("img");
        poster.className = "movie-poster";
        poster.src = movie.poster;
        poster.alt = `${movie.title} poster`;

        const info = document.createElement("div");
        info.className = "movie-info";

        const title = document.createElement("h3");
        title.className = "movie-title";
        title.textContent = movie.title;

        const genres = document.createElement("p");
        genres.className = "movie-date";

        if (Array.isArray(movie.genres) && movie.genres.length > 0) {

            genres.textContent = movie.genres
                .map(g => g.name || g)
                .join(" • ");
        } else if (typeof movie.genres === "string") {
            genres.textContent = movie.genres;
        } else {
            genres.textContent = "Genre unknown";
        }

        const bottom = document.createElement("div");
        bottom.className = "movie-bottom";

        const rating = document.createElement("span");
        rating.className = "movie-rating";
        rating.textContent = `⭐ ${movie.imdb_rating || "N/A"}`;

        const button = document.createElement("a");
        button.className = "details-button";
        button.textContent = "View Info";
        button.href = `details.html?id=${movie.id}`;

        bottom.appendChild(rating);
        bottom.appendChild(button);

        info.appendChild(title);
        info.appendChild(genres);
        info.appendChild(bottom);

        card.appendChild(poster);
        card.appendChild(info);

        moviesGrid.appendChild(card);
    });
}

function createPagination(
    current,
    total){
    pagination.innerHTML = "";

    if (total <= 1){
        return;
    }

    const previousButton =
        document.createElement(
            "button");

    previousButton.className =
        "pagination-arrow";

    previousButton.textContent ="‹";

    previousButton.disabled =
        current === 1;

    previousButton.addEventListener(
        "click",
        function (){

            if (current > 1) {
                changePage( current - 1);
            }
        }
    );


    pagination.appendChild(
        previousButton);

    const pages = [];

    if (total <= 7){
        for (
            let page = 1;
            page <= total;
            page++
        ){
            pages.push(page);

        }

    }else {

        pages.push(1);


        if (current > 4){
            pages.push("...");
        }


        const start =
            Math.max(2,current - 1 );

        const end = Math.min(total - 1,current + 1);

        for (
            let page = start;
            page <= end;
            page++
        ){
            pages.push(page);
        }

        if (current < total - 3){
            pages.push("...");
        }
        pages.push(total);
    }


    pages.forEach(
        function (page){
            if (page === "..."){
                const dots =
                    document.createElement( "span");

                dots.className = "pagination-dots";

                dots.textContent = "...";

                pagination.appendChild(dots);
                return;
            }

            const button =
                document.createElement( "button" );

            button.className ="pagination-number";

            button.textContent = page;


            if(page === current) {
                button.classList.add( "active");
            }


            button.addEventListener( "click", function (){
                    changePage(page);
                }
            );

            pagination.appendChild( button );
        }
    );

    const nextButton =
        document.createElement("button");

    nextButton.className = "pagination-arrow";

    nextButton.textContent = "›";

    nextButton.disabled = current === total;


    nextButton.addEventListener("click", function (){
            if (current < total){
                changePage(
                    current + 1 );
            }
        }
    );


    pagination.appendChild( nextButton );

}

async function changePage(page) {
    currentPage = page;


    if (currentSearch) {

        await performSearch( currentSearch, page);
        return;
    }


    if (currentGenre) {

        const genres =
            await getGenres();

        const selectedGenre =
            genres.find(
                function (genre) {

                    return (
                        genre.id ===
                        currentGenre
                    );
                }
            );

        await filterMoviesByGenre(
            currentGenre,
            selectedGenre?.name || "Genre",
            page
        );
        return;
    }

    await loadHomeMovies( page);
}