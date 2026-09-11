export interface WatchSession {
  uid: string;
  episodeSlug: string;
  durationSeconds: number;
  watchedSeconds: number;
  progress: number;
  completed: boolean;
  rewardExp: number;
}
