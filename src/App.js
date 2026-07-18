import React, { useState, useEffect } from "react";
import "./App.css";

const API_KEY = "2dca580c2a14b55200e784d157207b4d";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w500";

const GENRES = [
  { id: "", name: "All" },
  { id: 28, name: "Action" },
  { id: 35, name: "Comedy" },
  { id: 18, name: "Drama" },
  { id: 27, name: "Horror" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Sci-Fi" },
  { id: 53, name: "Thriller" },
  { id: 16, name: "Animation" },
];

export default function App() {
  const [movies, setMovies] = useState([]);
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [sort, setSort] = useState("popularity.desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [watchlist, setWatchlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cinemix_watchlist")) || []; }
    catch { return []; }
  });
  const [tab, setTab] = useState("home");
  const [trailer, setTrailer] = useState(null);

  const fetchMovies = async (p = 1) => {
    setLoading(true);
    try {
      let url;
      if (query.trim()) {
        url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${p}`;
      } else {
        url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=${sort}&page=${p}${genre ? `&with_genres=${genre}` : ""}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setMovies(data.results || []);
      setTotalPages(Math.min(data.total_pages || 1, 20));
      setPage(p);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchMovies(1); }, [genre, sort]);

  useEffect(() => {
    localStorage.setItem("cinemix_watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMovies(1);
  };

  const openMovie = async (movie) => {
    setSelected(movie);
    setTrailer(null);
    try {
      const res = await fetch(`${BASE_URL}/movie/${movie.id}/videos?api_key=${API_KEY}`);
      const data = await res.json();
      const t = (data.results || []).find(v => v.type === "Trailer" && v.site === "YouTube");
      if (t) setTrailer(t.key);
    } catch (e) {}
  };

  const toggleWatchlist = (movie) => {
    setWatchlist(prev =>
      prev.find(m => m.id === movie.id)
        ? prev.filter(m => m.id !== movie.id)
        : [...prev, movie]
    );
  };

  const inWatchlist = (id) => watchlist.some(m => m.id === id);

  const displayMovies = tab === "watchlist" ? watchlist : movies;

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo" onClick={() => setTab("home")}>
            <span className="logo-icon">🎬</span>
            <span className="logo-text">CINEMIX</span>
          </div>
          <nav className="nav">
            <button className={`nav-btn ${tab === "home" ? "active" : ""}`} onClick={() => setTab("home")}>Discover</button>
            <button className={`nav-btn ${tab === "watchlist" ? "active" : ""}`} onClick={() => setTab("watchlist")}>
              Watchlist {watchlist.length > 0 && <span className="badge">{watchlist.length}</span>}
            </button>
          </nav>
        </div>
      </header>

      {tab === "home" && (
        <div className="hero">
          <h1 className="hero-title">Find Your Next <span className="accent">Favorite Film</span></h1>
          <p className="hero-sub">Discover, explore & save movies you love</p>
          <form className="search-form" onSubmit={handleSearch}>
            <input
              className="search-input"
              type="text"
              placeholder="Search movies..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button className="search-btn" type="submit">Search</button>
          </form>
        </div>
      )}

      <main className="main">
        {tab === "home" && (
          <div className="filters">
            <div className="genre-pills">
              {GENRES.map(g => (
                <button
                  key={g.id}
                  className={`pill ${genre === g.id ? "pill-active" : ""}`}
                  onClick={() => { setGenre(g.id); setQuery(""); }}
                >
                  {g.name}
                </button>
              ))}
            </div>
            <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="popularity.desc">Most Popular</option>
              <option value="vote_average.desc">Top Rated</option>
              <option value="release_date.desc">Newest</option>
              <option value="revenue.desc">Highest Grossing</option>
            </select>
          </div>
        )}

        {tab === "watchlist" && (
          <div className="section-header">
            <h2 className="section-title">My Watchlist</h2>
            {watchlist.length === 0 && <p className="empty-msg">No movies saved yet. Browse and add some!</p>}
          </div>
        )}

        {loading ? (
          <div className="loader-wrap"><div className="loader"></div></div>
        ) : (
          <div className="grid">
            {displayMovies.map(movie => (
              <div className="card" key={movie.id} onClick={() => openMovie(movie)}>
                <div className="card-img-wrap">
                  {movie.poster_path
                    ? <img className="card-img" src={`${IMG_BASE}${movie.poster_path}`} alt={movie.title} />
                    : <div className="card-no-img">No Image</div>
                  }
                  <div className="card-overlay">
                    <span className="rating">⭐ {movie.vote_average?.toFixed(1)}</span>
                    <button
                      className={`wl-btn ${inWatchlist(movie.id) ? "wl-active" : ""}`}
                      onClick={e => { e.stopPropagation(); toggleWatchlist(movie); }}
                    >
                      {inWatchlist(movie.id) ? "✓ Saved" : "+ Save"}
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <h3 className="card-title">{movie.title}</h3>
                  <p className="card-year">{movie.release_date?.slice(0, 4) || "N/A"}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "home" && !loading && totalPages > 1 && (
          <div className="pagination">
            <button className="page-btn" disabled={page === 1} onClick={() => fetchMovies(page - 1)}>← Prev</button>
            <span className="page-info">Page {page} of {totalPages}</span>
            <button className="page-btn" disabled={page === totalPages} onClick={() => fetchMovies(page + 1)}>Next →</button>
          </div>
        )}
      </main>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            <div className="modal-content">
              <div className="modal-left">
                {selected.poster_path
                  ? <img className="modal-poster" src={`${IMG_BASE}${selected.poster_path}`} alt={selected.title} />
                  : <div className="modal-no-img">No Image</div>
                }
              </div>
              <div className="modal-right">
                <h2 className="modal-title">{selected.title}</h2>
                <div className="modal-meta">
                  <span className="meta-badge">⭐ {selected.vote_average?.toFixed(1)}</span>
                  <span className="meta-badge">{selected.release_date?.slice(0, 4)}</span>
                  {selected.adult && <span className="meta-badge red">18+</span>}
                </div>
                <p className="modal-overview">{selected.overview || "No description available."}</p>
                <div className="modal-actions">
                  <button
                    className={`modal-wl-btn ${inWatchlist(selected.id) ? "saved" : ""}`}
                    onClick={() => toggleWatchlist(selected)}
                  >
                    {inWatchlist(selected.id) ? "✓ Saved to Watchlist" : "+ Add to Watchlist"}
                  </button>
                </div>
                {trailer && (
                  <div className="trailer-wrap">
                    <h4 className="trailer-label">Trailer</h4>
                    <div className="trailer-frame">
                      <iframe
                        src={`https://www.youtube.com/embed/${trailer}`}
                        title="Trailer"
                        allowFullScreen
                        frameBorder="0"
                      ></iframe>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        <p>Made with ❤️ using TMDB API &nbsp;|&nbsp; CINEMIX © 2025</p>
      </footer>
    </div>
  );
}