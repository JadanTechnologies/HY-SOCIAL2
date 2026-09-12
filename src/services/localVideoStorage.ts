import { Video, Comment, User } from '../types';

const DB_NAME = 'hy_local_video_store';
const DB_VERSION = 1;
const STORE_BLOBS = 'video_blobs';
const STORE_METADATA = 'video_metadata';
const STORE_COMMENTS = 'video_comments';
const LOCAL_STORAGE_KEY = 'hy_local_videos_cache';

interface StoredBlobRecord {
  id: string;
  blob: Blob;
  mimeType: string;
  size: number;
  createdAt: number;
}

interface StoredVideoRecord {
  video: Video;
  hasBinaryBlob: boolean;
  simulation: {
    viewsCount: number;
    likesCount: number;
    commentsCount: number;
    savesCount: number;
    sharesCount: number;
    isLiked: boolean;
    isSaved: boolean;
    lastEngagedAt?: string;
  };
  createdAt: number;
}

class LocalVideoStorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private activeBlobUrls: Map<string, string> = new Map();
  private localVideoIdSet: Set<string> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initLocalIndex();
    }
  }

  private initLocalIndex() {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const records: StoredVideoRecord[] = JSON.parse(cached);
        records.forEach((r) => this.localVideoIdSet.add(r.video.id));
      }
    } catch {}
  }

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB not supported in this environment'));
      }

      const req = window.indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_BLOBS)) {
          db.createObjectStore(STORE_BLOBS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_METADATA)) {
          db.createObjectStore(STORE_METADATA, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_COMMENTS)) {
          const commentStore = db.createObjectStore(STORE_COMMENTS, { keyPath: 'id' });
          commentStore.createIndex('videoId', 'videoId', { unique: false });
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    return this.dbPromise;
  }

  public isLocalVideo(videoId: string): boolean {
    return this.localVideoIdSet.has(videoId) || videoId.startsWith('v-local-') || videoId.startsWith('v-rec-');
  }

  /**
   * Saves a real uploaded or recorded video into IndexedDB & persistent metadata
   */
  public async saveLocalVideo(
    videoData: Video,
    videoBlob?: Blob | File
  ): Promise<Video> {
    const videoId = videoData.id || `v-local-${Date.now()}`;
    const hasBinaryBlob = Boolean(videoBlob && videoBlob.size > 0);

    let finalVideoUrl = videoData.videoUrl;

    if (hasBinaryBlob && videoBlob) {
      try {
        const db = await this.openDB();
        const tx = db.transaction(STORE_BLOBS, 'readwrite');
        const store = tx.objectStore(STORE_BLOBS);

        const record: StoredBlobRecord = {
          id: videoId,
          blob: videoBlob,
          mimeType: videoBlob.type || 'video/webm',
          size: videoBlob.size,
          createdAt: Date.now(),
        };

        await new Promise((res, rej) => {
          const putReq = store.put(record);
          putReq.onsuccess = () => res(true);
          putReq.onerror = () => rej(putReq.error);
        });

        // Create and register object URL
        if (this.activeBlobUrls.has(videoId)) {
          URL.revokeObjectURL(this.activeBlobUrls.get(videoId)!);
        }
        finalVideoUrl = URL.createObjectURL(videoBlob);
        this.activeBlobUrls.set(videoId, finalVideoUrl);
      } catch (err) {
        console.warn('[LocalVideoStorage] Failed to store blob in IndexedDB, fallback to memory url', err);
        if (videoBlob && !finalVideoUrl) {
          finalVideoUrl = URL.createObjectURL(videoBlob);
          this.activeBlobUrls.set(videoId, finalVideoUrl);
        }
      }
    }

    const completeVideo: Video = {
      ...videoData,
      id: videoId,
      videoUrl: finalVideoUrl,
      likesCount: videoData.likesCount ?? 0,
      viewsCount: Math.max(1, videoData.viewsCount ?? 1),
      commentsCount: videoData.commentsCount ?? 0,
      savesCount: videoData.savesCount ?? 0,
      sharesCount: videoData.sharesCount ?? 0,
      isLiked: Boolean(videoData.isLiked),
      isSaved: Boolean(videoData.isSaved),
      status: 'ready',
      processingStatus: 'ready',
      createdAt: videoData.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const record: StoredVideoRecord = {
      video: completeVideo,
      hasBinaryBlob,
      simulation: {
        viewsCount: completeVideo.viewsCount,
        likesCount: completeVideo.likesCount,
        commentsCount: completeVideo.commentsCount,
        savesCount: completeVideo.savesCount,
        sharesCount: completeVideo.sharesCount,
        isLiked: Boolean(completeVideo.isLiked),
        isSaved: Boolean(completeVideo.isSaved),
        lastEngagedAt: new Date().toISOString(),
      },
      createdAt: Date.now(),
    };

    // Store in IndexedDB Metadata
    try {
      const db = await this.openDB();
      const tx = db.transaction(STORE_METADATA, 'readwrite');
      const store = tx.objectStore(STORE_METADATA);
      await new Promise((res, rej) => {
        const putReq = store.put({ id: videoId, ...record });
        putReq.onsuccess = () => res(true);
        putReq.onerror = () => rej(putReq.error);
      });
    } catch (err) {
      console.warn('[LocalVideoStorage] IndexedDB metadata store error', err);
    }

    // Mirror in localStorage for fast sync lookups
    this.updateLocalStorageCache(record);
    this.localVideoIdSet.add(videoId);

    return completeVideo;
  }

  /**
   * Retrieves all locally saved videos with live playable video URLs
   */
  public async getLocalVideos(): Promise<Video[]> {
    const list: Video[] = [];

    // Attempt IndexedDB read first
    try {
      const db = await this.openDB();
      const tx = db.transaction([STORE_METADATA, STORE_BLOBS], 'readonly');
      const metaStore = tx.objectStore(STORE_METADATA);
      const blobStore = tx.objectStore(STORE_BLOBS);

      const records: StoredVideoRecord[] = await new Promise((res, rej) => {
        const req = metaStore.getAll();
        req.onsuccess = () => res(req.result || []);
        req.onerror = () => rej(req.error);
      });

      for (const item of records) {
        let liveUrl = item.video.videoUrl;

        // If it had a binary blob, check if we need to regenerate its active Object URL
        if (item.hasBinaryBlob) {
          if (this.activeBlobUrls.has(item.video.id)) {
            liveUrl = this.activeBlobUrls.get(item.video.id)!;
          } else {
            const blobRecord: StoredBlobRecord | null = await new Promise((res) => {
              const bReq = blobStore.get(item.video.id);
              bReq.onsuccess = () => res(bReq.result || null);
              bReq.onerror = () => res(null);
            });

            if (blobRecord && blobRecord.blob) {
              liveUrl = URL.createObjectURL(blobRecord.blob);
              this.activeBlobUrls.set(item.video.id, liveUrl);
            }
          }
        }

        const enriched: Video = {
          ...item.video,
          videoUrl: liveUrl,
          likesCount: item.simulation?.likesCount ?? item.video.likesCount,
          viewsCount: item.simulation?.viewsCount ?? item.video.viewsCount,
          commentsCount: item.simulation?.commentsCount ?? item.video.commentsCount,
          savesCount: item.simulation?.savesCount ?? item.video.savesCount,
          sharesCount: item.simulation?.sharesCount ?? item.video.sharesCount,
          isLiked: item.simulation?.isLiked ?? item.video.isLiked,
          isSaved: item.simulation?.isSaved ?? item.video.isSaved,
        };

        list.push(enriched);
        this.localVideoIdSet.add(enriched.id);
      }
    } catch (err) {
      console.warn('[LocalVideoStorage] IndexedDB read failed, fallback to localStorage', err);
      // Fallback to localStorage
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
          const records: StoredVideoRecord[] = JSON.parse(cached);
          records.forEach((r) => {
            list.push(r.video);
            this.localVideoIdSet.add(r.video.id);
          });
        }
      } catch {}
    }

    // Sort newest first
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async getLocalVideoById(videoId: string): Promise<Video | null> {
    const videos = await this.getLocalVideos();
    return videos.find((v) => v.id === videoId) || null;
  }

  /**
   * Simulation Data Management: Toggle Likes
   */
  public async toggleLocalLike(videoId: string): Promise<{ success: boolean; isLiked: boolean; likesCount: number }> {
    const cached = this.getLocalStorageRecords();
    const idx = cached.findIndex((r) => r.video.id === videoId);

    let isLiked = false;
    let likesCount = 0;

    if (idx !== -1) {
      const record = cached[idx];
      const currentlyLiked = Boolean(record.simulation.isLiked);
      isLiked = !currentlyLiked;
      likesCount = Math.max(0, record.simulation.likesCount + (isLiked ? 1 : -1));

      record.simulation.isLiked = isLiked;
      record.simulation.likesCount = likesCount;
      record.video.isLiked = isLiked;
      record.video.likesCount = likesCount;

      this.saveLocalStorageRecords(cached);
      this.syncMetadataToIndexedDB(record);
    }

    return { success: true, isLiked, likesCount };
  }

  /**
   * Simulation Data Management: Toggle Saves / Bookmarks
   */
  public async toggleLocalSave(videoId: string): Promise<{ success: boolean; isSaved: boolean; savesCount: number }> {
    const cached = this.getLocalStorageRecords();
    const idx = cached.findIndex((r) => r.video.id === videoId);

    let isSaved = false;
    let savesCount = 0;

    if (idx !== -1) {
      const record = cached[idx];
      const currentlySaved = Boolean(record.simulation.isSaved);
      isSaved = !currentlySaved;
      savesCount = Math.max(0, record.simulation.savesCount + (isSaved ? 1 : -1));

      record.simulation.isSaved = isSaved;
      record.simulation.savesCount = savesCount;
      record.video.isSaved = isSaved;
      record.video.savesCount = savesCount;

      this.saveLocalStorageRecords(cached);
      this.syncMetadataToIndexedDB(record);
    }

    return { success: true, isSaved, savesCount };
  }

  /**
   * Simulation Data Management: Record Views
   */
  public async recordLocalView(videoId: string): Promise<{ success: boolean; viewsCount: number }> {
    const cached = this.getLocalStorageRecords();
    const idx = cached.findIndex((r) => r.video.id === videoId);

    let viewsCount = 1;
    if (idx !== -1) {
      const record = cached[idx];
      record.simulation.viewsCount = (record.simulation.viewsCount || 0) + 1;
      record.video.viewsCount = record.simulation.viewsCount;
      viewsCount = record.simulation.viewsCount;

      this.saveLocalStorageRecords(cached);
      this.syncMetadataToIndexedDB(record);
    }

    return { success: true, viewsCount };
  }

  /**
   * Simulation Data Management: Record Shares
   */
  public async recordLocalShare(videoId: string): Promise<{ success: boolean; sharesCount: number }> {
    const cached = this.getLocalStorageRecords();
    const idx = cached.findIndex((r) => r.video.id === videoId);

    let sharesCount = 1;
    if (idx !== -1) {
      const record = cached[idx];
      record.simulation.sharesCount = (record.simulation.sharesCount || 0) + 1;
      record.video.sharesCount = record.simulation.sharesCount;
      sharesCount = record.simulation.sharesCount;

      this.saveLocalStorageRecords(cached);
      this.syncMetadataToIndexedDB(record);
    }

    return { success: true, sharesCount };
  }

  /**
   * Local Comments Management
   */
  public async addLocalComment(videoId: string, text: string, author: User): Promise<Comment> {
    const newComment: Comment = {
      id: `c-local-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      videoId,
      author,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      likesCount: 0,
      repliesCount: 0,
    };

    // Save to IndexedDB
    try {
      const db = await this.openDB();
      const tx = db.transaction(STORE_COMMENTS, 'readwrite');
      const store = tx.objectStore(STORE_COMMENTS);
      store.put(newComment);
    } catch {}

    // Save to localStorage comment list
    try {
      const key = `hy_comments_${videoId}`;
      const existing: Comment[] = JSON.parse(localStorage.getItem(key) || '[]');
      existing.unshift(newComment);
      localStorage.setItem(key, JSON.stringify(existing));
    } catch {}

    // Increment video comment count simulation
    const cached = this.getLocalStorageRecords();
    const idx = cached.findIndex((r) => r.video.id === videoId);
    if (idx !== -1) {
      cached[idx].simulation.commentsCount = (cached[idx].simulation.commentsCount || 0) + 1;
      cached[idx].video.commentsCount = cached[idx].simulation.commentsCount;
      this.saveLocalStorageRecords(cached);
      this.syncMetadataToIndexedDB(cached[idx]);
    }

    return newComment;
  }

  public async getLocalComments(videoId: string): Promise<Comment[]> {
    try {
      const key = `hy_comments_${videoId}`;
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch {}

    try {
      const db = await this.openDB();
      const tx = db.transaction(STORE_COMMENTS, 'readonly');
      const store = tx.objectStore(STORE_COMMENTS);
      const index = store.index('videoId');
      return await new Promise((res) => {
        const req = index.getAll(videoId);
        req.onsuccess = () => res(req.result || []);
        req.onerror = () => res([]);
      });
    } catch {
      return [];
    }
  }

  /**
   * Delete local video and revoke object URL
   */
  public async deleteLocalVideo(videoId: string): Promise<boolean> {
    if (this.activeBlobUrls.has(videoId)) {
      URL.revokeObjectURL(this.activeBlobUrls.get(videoId)!);
      this.activeBlobUrls.delete(videoId);
    }
    this.localVideoIdSet.delete(videoId);

    // Remove from localStorage
    const cached = this.getLocalStorageRecords().filter((r) => r.video.id !== videoId);
    this.saveLocalStorageRecords(cached);

    // Remove from IndexedDB
    try {
      const db = await this.openDB();
      const tx = db.transaction([STORE_METADATA, STORE_BLOBS], 'readwrite');
      tx.objectStore(STORE_METADATA).delete(videoId);
      tx.objectStore(STORE_BLOBS).delete(videoId);
    } catch {}

    return true;
  }

  // --- Internal Helpers ---

  private getLocalStorageRecords(): StoredVideoRecord[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveLocalStorageRecords(records: StoredVideoRecord[]) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
    } catch {}
  }

  private updateLocalStorageCache(newRecord: StoredVideoRecord) {
    const existing = this.getLocalStorageRecords().filter((r) => r.video.id !== newRecord.video.id);
    existing.unshift(newRecord);
    this.saveLocalStorageRecords(existing);
  }

  private async syncMetadataToIndexedDB(record: StoredVideoRecord) {
    try {
      const db = await this.openDB();
      const tx = db.transaction(STORE_METADATA, 'readwrite');
      tx.objectStore(STORE_METADATA).put({ id: record.video.id, ...record });
    } catch {}
  }
}

export const localVideoStorage = new LocalVideoStorageService();
