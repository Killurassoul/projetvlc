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

export const toggleFavorite = (videoId: string): LibraryState => {
  const library = getLibrary();
  const item = library.items.find(i => i.id === videoId);
  if (item) {
    item.isFavorite = !item.isFavorite;
    saveLibrary(library);
  } else {
    // If it's a series episode or item not directly matching, check if any matching items exist
    const seriesItems = library.items.filter(i => i.seriesId === videoId);
    if (seriesItems.length > 0) {
      const anyUnfav = seriesItems.some(i => !i.isFavorite);
      seriesItems.forEach(i => i.isFavorite = anyUnfav);
      saveLibrary(library);
    }
  }
  return library;
};

export const removeFromLibrary = (videoId: string): LibraryState => {
  const library = getLibrary();
  library.items = library.items.filter(i => i.id !== videoId && i.seriesId !== videoId);
  library.history = library.history.filter(id => id !== videoId);
  saveLibrary(library);
  return library;
};

export const updateVideoMetadata = (videoId: string, updates: Partial<VideoMetadata>): LibraryState => {
  const library = getLibrary();
  const itemsToUpdate = library.items.filter(i => i.id === videoId || i.seriesId === videoId);
  itemsToUpdate.forEach(item => {
    if (updates.title) item.title = updates.title;
    if (updates.category) item.category = updates.category;
    if (updates.year) item.year = updates.year;
    if (updates.description) item.description = updates.description;
  });
  saveLibrary(library);
  return library;
};

