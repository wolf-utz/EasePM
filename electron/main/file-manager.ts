import * as path from "path";
import * as fs from "fs";
import { pathToFileURL } from "url";

class FileManager {
  /**
   * Returns the absolute path of a file given a folder path and file name.
   * @param folderPath - The path to the folder.
   * @param fileName - The name of the file.
   * @returns The absolute path of the file.
   */
  getAbsolutePath(folderPath: string, fileName: string): string {
    return path.resolve(folderPath, fileName);
  }

  /**
   * Validates if a file exists given a folder path and file name.
   * @param folderPath - The path to the folder.
   * @param fileName - The name of the file.
   * @returns True if the file exists, false otherwise.
   */
  fileExists(folderPath: string, fileName: string): boolean {
    const filePath = this.getAbsolutePath(folderPath, fileName);
    return fs.existsSync(filePath);
  }

  /**
   * Creates a folder if it does not exist.
   * @param folderPath - The path to the folder.
   */
  createFolderIfNotExists(folderPath: string): void {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
  }

  /**
   * Moves a file to a given path.
   * @param sourceFolderPath - The source folder path.
   * @param fileName - The name of the file.
   * @param destinationFolderPath - The destination folder path.
   */
  moveFile(
    sourceFolderPath: string,
    fileName: string,
    destinationFolderPath: string
  ): void {
    this.createFolderIfNotExists(destinationFolderPath);
    const sourceFilePath = this.getAbsolutePath(sourceFolderPath, fileName);
    const destinationFilePath = this.getAbsolutePath(
      destinationFolderPath,
      fileName
    );
    fs.renameSync(sourceFilePath, destinationFilePath);
  }

  /**
   * Returns the absolute file URL of a file given a folder path and file name.
   * @param folderPath - The path to the folder.
   * @param fileName - The name of the file.
   * @returns The absolute file URL of the file.
   */
  getFileUrl(folderPath: string, fileName: string): string {
    const filePath = this.getAbsolutePath(folderPath, fileName);
    return pathToFileURL(filePath).href;
  }

  /**
   * Returns the blob of a file given a folder path and file name.
   * @param folderPath - The path to the folder.
   * @param fileName - The name of the file.
   * @returns The blob of the file.
   */
  getFileBlob(folderPath: string, fileName: string): Buffer | null {
    const filePath = this.getAbsolutePath(folderPath, fileName);
    if (this.fileExists(folderPath, fileName)) {
      return fs.readFileSync(filePath);
    }
    return null;
  }

  /**
   * Returns the base64 string of a file given a folder path and file name.
   * @param folderPath - The path to the folder.
   * @param fileName - The name of the file.
   * @returns The base64 string of the file.
   */
  getFileBase64(folderPath: string, fileName: string): string | null {
    const fileBlob = this.getFileBlob(folderPath, fileName);
    if (this.fileExists(folderPath, fileName)) {
      return fileBlob.toString("base64");
    }
    return null;
  }
}

export default FileManager;
