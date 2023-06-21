import inquirer from 'inquirer';
import * as helper from './helper.js';

function formatPlaylist(playlist) {
  let playlistName = `* ${playlist.name}`;
  playlistName +=
    playlist.description === '' ? '' : ` | ${playlist.description}`;
  playlistName += playlist.public ? ' | Public' : ' | Private';
  playlistName += ` | ${playlist.tracks.total} tracks`;
  return { name: playlistName, value: playlist };
}

function formatTrack(track) {
  let trackName = `${track.name}`;
  trackName += ' | ';
  trackName += track.artists.map((a) => a.name).join(', ');
  trackName += ` | Link: ${track.preview_url}`;
  return { name: trackName, value: track };
}

function formatGenre(genre) {
  return `* ${genre.key} - ${genre.value} times`;
}

export function displayGenres(genres) {
  const genresDisplay = genres.map(formatGenre);

  console.log(genresDisplay.join('\n'));
}

function formatArtist(artist) {
  return `* ${artist.key} - ${artist.value} times`;
}

export function displayArtists(artists) {
  const artistsDisplay = artists.map(formatArtist);

  console.log(artistsDisplay.join('\n'));
}

export async function listPlaylists(playlists) {
  const playlistsDisplay = playlists.map(formatPlaylist);

  const playlistAnswers = await inquirer.prompt([
    {
      type: 'list',
      name: 'playlist',
      message: 'Select a playlist:',
      choices: [
        ...playlistsDisplay,
        { name: '* OTHER PLAYLIST', value: 'other' },
      ],
    },
    {
      type: 'input',
      name: 'otherPlaylist',
      message: 'Type in the playlist ID:',
      when(answers) {
        return answers.playlist === 'other';
      },
    },
  ]);

  if (playlistAnswers.playlist === 'other') {
    const playlistData = await helper.fetchPlaylistData(
      playlistAnswers.otherPlaylist
    );
    if (playlistData.statusCode === 404) {
      console.log('Playlist not found');
      console.log(playlistData.body.error.message);
      return await listPlaylists(playlists);
    }
    return playlistData.body;
  }

  return playlistAnswers.playlist;
}

export const PLAYLIST_ACTIONS = {
  SHOW_GENRES: 'genres',
  SHOW_RECOMMENDATIONS: 'recommendations',
  SHOW_ARTISTS: 'artists',
  REMOVE_DUPLICATES: 'duplicates',
};

export async function listPlaylistActions() {
  const actionAnswer = await inquirer.prompt({
    type: 'list',
    name: 'action',
    message: `What to do with this playlist?`,
    choices: [
      { name: 'Show most common genres', value: PLAYLIST_ACTIONS.SHOW_GENRES },
      {
        name: 'Search for recommended tracks',
        value: PLAYLIST_ACTIONS.SHOW_RECOMMENDATIONS,
      },
      {
        name: 'Show most common artists',
        value: PLAYLIST_ACTIONS.SHOW_ARTISTS,
      },
      { name: 'Remove duplicates', value: PLAYLIST_ACTIONS.REMOVE_DUPLICATES },
    ],
  });

  return actionAnswer.action;
}

export async function askForCount(messageObject) {
  const countAnswers = await inquirer.prompt([
    {
      type: 'list',
      name: 'count',
      message: `How many top ${messageObject} to show?`,
      choices: [
        { name: '* TOP 10', value: 10 },
        {
          name: '* TOP 100',
          value: 100,
        },
        {
          name: '* ALL',
          value: 'all',
        },
        {
          name: '* OTHER',
          value: 'other',
        },
      ],
    },
    {
      type: 'input',
      name: 'otherCount',
      message: `Top ${messageObject} to show: `,
      when(answers) {
        return answers.count === 'other';
      },
    },
  ]);

  if (countAnswers.otherCount) return countAnswers.otherCount;
  else return countAnswers.count;
}

export async function recommendationBasedOn() {
  const seedAnswer = await inquirer.prompt({
    type: 'list',
    name: 'seed',
    message: `Recommendations based on:`,
    choices: [
      { name: 'ARTISTS', value: helper.RECOMMEND_SEEDS.ARTISTS },
      {
        name: 'GENRES',
        value: helper.RECOMMEND_SEEDS.GENRES,
      },
      {
        name: 'TRACKS',
        value: helper.RECOMMEND_SEEDS.TRACKS,
      },
    ],
  });

  return seedAnswer.seed;
}

export async function showTracks(tracks) {
  const tracksDisplay = tracks.map(formatTrack);

  const checkedTracks = await inquirer.prompt({
    type: 'checkbox',
    message: 'Recommended tracks. Select which to add to playlist:',
    name: 'tracks',
    choices: [...tracksDisplay, new inquirer.Separator()],
  });

  return checkedTracks.tracks;
}

export async function searchAgain() {
  const againAnswer = await inquirer.prompt({
    type: 'confirm',
    message: 'Search again for recommendations?',
    name: 'again',
    default: false,
  });

  return againAnswer.again;
}
