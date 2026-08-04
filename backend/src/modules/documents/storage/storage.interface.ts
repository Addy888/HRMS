export interface UploadedFileResponse {
  fileUrl: string;
  fileName: string;
}

export interface IStorageService {
  /**
   * Uploads a file buffer/stream to the destination
   */
  uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    folder?: string,
  ): Promise<UploadedFileResponse>;

  /**
   * Deletes a file from the storage system
   */
  deleteFile(fileUrl: string): Promise<void>;
}
