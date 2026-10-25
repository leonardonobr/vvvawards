// api/tmdb.js
export default async function handler(req, res) {
  // Permite requisições do teu domínio
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { query, type = 'movie', department, gender } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Parâmetro de busca ausente' });
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Chave do TMDB não configurada no servidor' });
  }

  // Define a rota do TMDB (filme, série ou pessoa)
  let endpoint = `https://api.themoviedb.org/3/search/${type}?api_key=${apiKey}&language=pt-BR&query=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(endpoint);
    const data = await response.json();

    let results = data.results || [];

    // Filtros adicionais (ex: Diretor, Ator, Atriz ou Animação por gênero 16)
    if (department === 'Directing') {
      results = results.filter(person => person.known_for_department === 'Directing');
    } else if (department === 'Acting') {
      results = results.filter(person => {
        if (person.known_for_department !== 'Acting') return false;
        if (gender && person.gender !== Number(gender)) return false;
        return true;
      });
    } else if (type === 'movie' && req.query.genre) {
      results = results.filter(movie => movie.genre_ids && movie.genre_ids.includes(Number(req.query.genre)));
    }

    // Formata os dados essenciais para o frontend
    const formattedResults = results.map(item => ({
      id: item.id,
      name: item.title || item.name,
      year: (item.release_date || item.first_air_date || '').split('-')[0] || 'N/D',
      img: item.poster_path || item.profile_path 
        ? `https://image.tmdb.org/t/p/w200${item.poster_path || item.profile_path}` 
        : 'https://via.placeholder.com/200x300?text=Sem+Imagem'
    }));

    return res.status(200).json({ results: formattedResults });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao comunicar com a API do TMDB' });
  }
}