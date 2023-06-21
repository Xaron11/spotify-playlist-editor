import auth from 'spotify-personal-auth';
import SpotifyAPI from 'spotify-web-api-node';
import * as dotenv from 'dotenv';
import * as helper from './helper.js';
import * as cli from './cli.js';
import * as util from './util.js';

dotenv.config();

auth.config({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  scope: [
    'playlist-read-private',
    'playlist-read-collaborative',
    'playlist-modify-private',
    'playlist-modify-public',
    'user-library-read',
    'user-library-modify',
    'user-read-private',
  ],
  path: './tokens.json',
});

export const api = new SpotifyAPI();

async function recommendTracks(playlist, allTracks, seed) {
  const tracks = await helper.fetchRecommendedTracks(allTracks, seed);
  const checkedTracks = await cli.showTracks(tracks);
  if (checkedTracks.length > 0) {
    await helper.addToPlaylist(playlist, checkedTracks);
  }
  const again = await cli.searchAgain();
  if (again) await recommendTracks(playlist, allTracks, seed);
}

async function main() {
  const [token, refresh] = await auth.token().catch(console.log);
  api.setAccessToken(token);
  api.setRefreshToken(refresh);

  const playlistsData = await api.getUserPlaylists();
  const playlist = await cli.listPlaylists(playlistsData.body.items);

  const playlistAction = await cli.listPlaylistActions();
  switch (playlistAction) {
    case cli.PLAYLIST_ACTIONS.SHOW_GENRES:
      let genreCount = await cli.askForCount('genres');
      const genres = await helper.fetchGenresOfPlaylist(playlist);
      const genreFrequencies = util.sortFrequencies(
        util.countFrequencies(genres)
      );
      if (genreCount === 'all') genreCount = genreFrequencies.length;
      cli.displayGenres(genreFrequencies.slice(0, genreCount));
      break;
    case cli.PLAYLIST_ACTIONS.SHOW_RECOMMENDATIONS:
      const seed = await cli.recommendationBasedOn();
      const allTracks = await helper.fetchPlaylistTracks(playlist);
      await recommendTracks(playlist, allTracks, seed);
      break;
    case cli.PLAYLIST_ACTIONS.SHOW_ARTISTS:
      let artistCount = await cli.askForCount('artists');
      const artists = await helper.fetchArtistsOfPlaylist(playlist);
      const artistFrequencies = util.sortFrequencies(
        util.countFrequencies(artists.map((a) => a.name))
      );
      if (artistCount === 'all') artistCount = artistFrequencies.length;
      cli.displayArtists(artistFrequencies.slice(0, artistCount));
      break;
    case cli.PLAYLIST_ACTIONS.REMOVE_DUPLICATES:
      break;

    default:
      break;
  }
}

main();
