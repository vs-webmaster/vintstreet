import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fileToBase64, uploadImageToStorage } from '../imageUtils';
import * as storageService from '@/services/storage';

vi.mock('@/services/storage');

describe('Image Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fileToBase64', () => {
    it('should convert file to base64 data URL', async () => {
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      
      const result = await fileToBase64(file);
      
      expect(result).toContain('data:');
      expect(result).toContain('base64');
    });

    it('should handle file read errors', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock FileReader to simulate error
      const originalFileReader = global.FileReader;
      global.FileReader = vi.fn().mockImplementation(() => {
        const reader = new originalFileReader();
        const mockReadAsDataURL = vi.fn(() => {
          setTimeout(() => {
            if (reader.onerror) {
              const progressEvent = {
                type: 'error',
                target: reader,
                currentTarget: reader,
                lengthComputable: false,
                loaded: 0,
                total: 0,
                bubbles: false,
                cancelable: false,
                cancelBubble: false,
                composed: false,
                defaultPrevented: false,
                eventPhase: 0,
                isTrusted: false,
                returnValue: false,
                timeStamp: Date.now(),
                preventDefault: vi.fn(),
                stopImmediatePropagation: vi.fn(),
                stopPropagation: vi.fn(),
                initEvent: vi.fn(),
                AT_TARGET: 0,
                BUBBLING_PHASE: 0,
                CAPTURING_PHASE: 0,
                NONE: 0,
              } as unknown as ProgressEvent<FileReader>;
              reader.onerror(progressEvent);
            }
          }, 0);
          return undefined;
        });
        vi.spyOn(reader, 'readAsDataURL').mockImplementation(mockReadAsDataURL);
        return reader;
      }) as unknown as typeof FileReader;

      await expect(fileToBase64(file)).rejects.toThrow('Error reading file');
      
      global.FileReader = originalFileReader;
    });
  });

  describe('uploadImageToStorage', () => {
    it('should upload image and return URL', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const mockUrl = 'https://example.com/image.jpg';

      vi.mocked(storageService.uploadFile).mockResolvedValue({
        success: true,
        data: {
          url: mockUrl,
          path: 'path/to/image.jpg',
        },
      });

      const result = await uploadImageToStorage(file, 'user-123');

      expect(result).toBe(mockUrl);
      expect(storageService.uploadFile).toHaveBeenCalledWith(file, {
        bucket: 'product-images',
        pathPrefix: 'user-123',
      });
    });

    it('should throw error on upload failure', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const mockError = { message: 'Upload failed', code: 'STORAGE_ERROR' };

      vi.mocked(storageService.uploadFile).mockResolvedValue({
        success: false,
        error: mockError,
      });

      await expect(uploadImageToStorage(file, 'user-123')).rejects.toEqual(mockError);
    });

    it('should use custom bucket when provided', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

      vi.mocked(storageService.uploadFile).mockResolvedValue({
        success: true,
        data: {
          url: 'https://example.com/image.jpg',
          path: 'path/to/image.jpg',
        },
      });

      await uploadImageToStorage(file, 'user-123', 'avatars');

      expect(storageService.uploadFile).toHaveBeenCalledWith(file, {
        bucket: 'avatars',
        pathPrefix: 'user-123',
      });
    });
  });
});
