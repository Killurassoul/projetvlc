import SrtParser from 'srt-parser-2';
import { Subtitle } from '../types';

const parser = new SrtParser();

export const parseSrt = (srtContent: string): Subtitle[] => {
  try {
    const parsed = parser.fromSrt(srtContent);
    return parsed.map((item, index) => ({
      id: index.toString(),
      startTime: item.startTime,
      endTime: item.endTime,
      text: item.text,
      seconds: item.startSeconds
    }));
  } catch (error) {
    console.error('Error parsing SRT:', error);
    return [];
  }
};

export const getContextForTime = (subtitles: Subtitle[], currentTime: number, windowSeconds: number = 30): string => {
  const relevantSubs = subtitles.filter(sub => 
    sub.seconds >= currentTime - windowSeconds && sub.seconds <= currentTime
  );
  return relevantSubs.map(sub => sub.text).join(' ');
};

export const getFullSummaryContext = (subtitles: Subtitle[]): string => {
  // Extract key points or just first 50 lines for summary
  return subtitles.slice(0, 100).map(sub => sub.text).join(' ');
};
