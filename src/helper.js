import { api } from './main.js';
import * as util from './util.js';

/**
 * @param {number} total
 * @param {(offset: number, limit: number) => Promise<Array<T>>} fetchFunction
 * @returns {Promise<Array<T>>}
 */
async function fetchAll(total, fetchFunction) {
  let data = [];
  const loopTotal = Math.ceil(total / 50);
  //const loopTotal = 1;
  for (let i = 0; i < loopTotal; i++) {
    let dataSlice = await fetchFunction(i * 50, 50);
    data.push(...dataSlice);
  }
  return data;
}

export async function fetchPlaylistTracks(playlist) {
  const tracks = await fetchAll(
    playlist.tracks.total,
    async (offset, limit) => {
      const tracksResponse = await api.getPlaylistTracks(playlist.id, {
        offset: offset,
        limit: limit,
      });
      return tracksResponse.body.items.map((i) => i.track);
    }
  );
  return tracks;
}

export function getArtistsOfTracks(tracks) {
  let artists = tracks.map((t) => t.artists).flat();
  return artists;
}

export function getDistinctArtistsOfTracks(tracks) {
  let artists = getArtistsOfTracks(tracks);
  artists = artists.filter(
    (v, i, arr) => arr.findIndex((o) => o.id === v.id) === i
  );
  return artists;
}

export function getGenresOfArtists(artistsDetailed) {
  const genres = artistsDetailed.map((a) => a.genres).flat();
  return genres;
}

export function getDistinctGenresOfArtists(artistsDetailed) {
  let genres = getGenresOfArtists(artistsDetailed);
  genres = genres.filter((v, i, arr) => arr.findIndex((o) => o === v) === i);
  return genres;
}

export function getDistinctGenres(genres) {
  genres = genres.filter((v, i, arr) => arr.findIndex((o) => o === v) === i);
  return genres;
}

export async function fetchArtistsDetails(artists) {
  const artistsDetailed = await fetchAll(
    artists.length,
    async (offset, limit) => {
      const artistsResponse = await api.getArtists(
        artists.slice(offset, offset + limit).map((a) => a.id)
      );
      return artistsResponse.body.artists;
    }
  );
  return artistsDetailed;
}

export async function fetchArtistsGenres(artists) {
  const artistsDetailed = await fetchArtistsDetails(artists);
  return getGenresOfArtists(artistsDetailed);
}

export async function fetchDistinctGenresOfTracks(tracks) {
  const artists = getDistinctArtistsOfTracks(tracks);
  let genres = await fetchArtistsGenres(artists);
  genres = getDistinctGenres(genres);
  return genres;
}

export async function fetchGenresOfPlaylist(playlist) {
  const tracks = await fetchPlaylistTracks(playlist);
  const artists = getDistinctArtistsOfTracks(tracks);
  const genres = await fetchArtistsGenres(artists);
  return genres;
}

export async function fetchArtistsOfPlaylist(playlist) {
  const tracks = await fetchPlaylistTracks(playlist);
  const artists = getArtistsOfTracks(tracks);
  return artists;
}

export async function fetchPlaylistData(id) {
  const playlistData = api.getPlaylist(id).then(
    (data) => data,
    (err) => err
  );
  return playlistData;
}

export const RECOMMEND_SEEDS = {
  ARTISTS: 'artists',
  GENRES: 'genres',
  TRACKS: 'tracks',
};

export async function addToPlaylist(playlist, tracks) {
  const trackUris = tracks.map((t) => t.uri);
  await api.refreshAccessToken();
  await api.addTracksToPlaylist(playlist.id, trackUris);
}

export async function fetchRecommendedTracks(allTracks, seed) {
  let seedValues = [];
  switch (seed) {
    case RECOMMEND_SEEDS.ARTISTS:
      const artists = getArtistsOfTracks(allTracks);
      seedValues.push(...util.getRandomElements(artists, 5).map((a) => a.id));
      break;
    case RECOMMEND_SEEDS.GENRES:
      const genres = await fetchDistinctGenresOfTracks(allTracks);
      seedValues.push(...util.getRandomElements(genres, 5));
      break;
    case RECOMMEND_SEEDS.TRACKS:
      seedValues.push(...util.getRandomElements(allTracks, 5).map((t) => t.id));
    default:
      break;
  }
  let recommendationOptions = {};
  recommendationOptions[`seed_${seed}`] = seedValues.join(',');

  const recommendedTracksData = await api.getRecommendations(
    recommendationOptions
  );
  const tracks = recommendedTracksData.body.tracks;
  let newTracks = [];
  tracks.forEach((t) => {
    const inPlaylist = allTracks.find((at) => at.id === t.id);
    if (!inPlaylist) {
      newTracks.push(t);
    }
  });
  return newTracks;
}
