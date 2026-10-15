const BASE_URL = "https://www.moviesapi.ir/api/v1";

async function apiRequest(endpoint) {
    const response = await fetch(`${BASE_URL}${endpoint}`);

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }

    return await response.json();
}

async function getMovies(page = 1) {
    return await apiRequest(`/movies?page=${page}`);
}

async function searchMovies(query, page = 1) {
    return await apiRequest(
        `/movies?q=${encodeURIComponent(query)}&page=${page}`
    );
}

async function getMovieDetails(movieId) {
    return await apiRequest(`/movies/${movieId}`);
}

async function getGenres() {
    return await apiRequest("/genres");
}

async function getMoviesByGenre(genreId, page = 1) {
    return await apiRequest(`/genres/${genreId}/movies?page=${page}`);
}

async function fetchDoublePage(fetchFn, page = 1, ...args) {
    const firstApiPage = page * 2 - 1;
    const secondApiPage = page * 2;

    const [firstPage, secondPage] = await Promise.all([
        fetchFn(...args, firstApiPage),
        fetchFn(...args, secondApiPage)
    ]);

    const movies = [];

    if (firstPage.data) movies.push(...firstPage.data);
    if (secondPage.data) movies.push(...secondPage.data);

    const totalCount = Number(firstPage.metadata?.total_count || 0);

    return { movies, totalCount, firstPage, secondPage };
}
