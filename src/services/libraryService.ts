import { VideoMetadata, LibraryState } from '../types';
import { MOCK_VIDEOS } from '../constants';

const STORAGE_KEY = 'rassoul_media_library';

const initialState: LibraryState = {
  items: [],
  history: []
};

export const getLibrary = (): LibraryState => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return initialState;
  try {
    return JSON.parse(stored);
  } catch (e) {
    return initialState;
  }
};

export const saveLibrary = (state: LibraryState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const updateVideoProgress = (videoId: string, progress: number, totalDuration: number) => {
  const library = getLibrary();
  const item = library.items.find(i => i.id === videoId);
  if (item) {
    item.progress = progress;
    item.totalDuration = totalDuration;
    item.lastWatched = Date.now();
    
    // Add to history if not already there or move to top
    library.history = [videoId, ...library.history.filter(id => id !== videoId)];
    
    saveLibrary(library);
  }
};

export const getNextEpisode = (currentVideo: VideoMetadata): VideoMetadata | null => {
  if (!currentVideo.seriesId || !currentVideo.season || !currentVideo.episode) return null;
  
  const library = getLibrary();
  return library.items.find(i => 
    i.seriesId === currentVideo.seriesId && 
    i.season === currentVideo.season && 
    i.episode === (currentVideo.episode! + 1)
  ) || null;
};

export const addToLibrary = (video: VideoMetadata) => {
  const library = getLibrary();
  if (!library.items.find(i => i.id === video.id)) {
    library.items.push(video);
    saveLibrary(library);
  }
};
