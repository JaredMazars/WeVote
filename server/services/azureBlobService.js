import { BlobServiceClient } from '@azure/storage-blob';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Azure Blob Storage Configuration
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const AZURE_STORAGE_ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const AZURE_STORAGE_ACCOUNT_KEY = process.env.AZURE_STORAGE_ACCOUNT_KEY;
const CONTAINER_NAME = 'proxy-forms'; // Container name for proxy PDFs

class AzureBlobService {
  constructor() {
    this.blobServiceClient = null;
    this.containerClient = null;
    this.initialized = false;
  }

  /**
   * Initialize the Azure Blob Service
   */
  async initialize() {
    try {
      console.log('🔵 Initializing Azure Blob Storage...');

      // Check if we have connection string or account credentials
      if (AZURE_STORAGE_CONNECTION_STRING) {
        console.log('📝 Using connection string authentication');
        this.blobServiceClient = BlobServiceClient.fromConnectionString(
          AZURE_STORAGE_CONNECTION_STRING
        );
      } else if (AZURE_STORAGE_ACCOUNT_NAME && AZURE_STORAGE_ACCOUNT_KEY) {
        console.log('📝 Using account name/key authentication');
        const connectionString = `DefaultEndpointsProtocol=https;AccountName=${AZURE_STORAGE_ACCOUNT_NAME};AccountKey=${AZURE_STORAGE_ACCOUNT_KEY};EndpointSuffix=core.windows.net`;
        this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
      } else {
        throw new Error('Azure Storage credentials not found in environment variables');
      }

      // Get container client
      this.containerClient = this.blobServiceClient.getContainerClient(CONTAINER_NAME);

      // Create container if it doesn't exist
      const exists = await this.containerClient.exists();
      if (!exists) {
        console.log('📦 Creating container:', CONTAINER_NAME);
        // Create container without specifying access level (will be private by default)
        await this.containerClient.create();
        console.log('✅ Container created successfully (private access)');
      } else {
        console.log('✅ Container already exists:', CONTAINER_NAME);
      }

      this.initialized = true;
      console.log('✅ Azure Blob Storage initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Azure Blob Storage:', error.message);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Upload a file to Azure Blob Storage
   * @param {string} userId - User ID
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} fileName - Original filename
   * @param {string} contentType - File content type
   * @returns {Promise<Object>} Upload result with blob URL and metadata
   */
  async uploadFile(userId, fileBuffer, fileName, contentType = 'application/pdf') {
    try {
      if (!this.initialized) {
        const initResult = await this.initialize();
        if (!initResult) {
          throw new Error('Failed to initialize Azure Blob Storage');
        }
      }

      // Generate unique blob name
      const timestamp = Date.now();
      const blobName = `user-${userId}/proxy-${timestamp}-${fileName}`;

      console.log('📤 Uploading file to Azure Blob Storage:', blobName);

      // Get block blob client
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

      // Upload data
      const uploadResponse = await blockBlobClient.uploadData(fileBuffer, {
        blobHTTPHeaders: {
          blobContentType: contentType
        },
        metadata: {
          userId: userId.toString(),
          originalFileName: fileName,
          uploadDate: new Date().toISOString()
        }
      });

      console.log('✅ File uploaded successfully');
      console.log('   Blob URL:', blockBlobClient.url);
      console.log('   Request ID:', uploadResponse.requestId);

      return {
        success: true,
        blobName: blobName,
        blobUrl: blockBlobClient.url,
        fileName: fileName,
        uploadDate: new Date().toISOString(),
        requestId: uploadResponse.requestId
      };
    } catch (error) {
      console.error('❌ Error uploading file to Azure Blob Storage:', error);
      throw error;
    }
  }

  /**
   * Download a file from Azure Blob Storage
   * @param {string} blobName - Blob name (path)
   * @returns {Promise<Buffer>} File buffer
   */
  async downloadFile(blobName) {
    try {
      if (!this.initialized) {
        const initResult = await this.initialize();
        if (!initResult) {
          throw new Error('Failed to initialize Azure Blob Storage');
        }
      }

      console.log('📥 Downloading file from Azure Blob Storage:', blobName);

      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      
      // Download blob
      const downloadResponse = await blockBlobClient.download(0);
      
      // Convert stream to buffer
      const chunks = [];
      for await (const chunk of downloadResponse.readableStreamBody) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      console.log('✅ File downloaded successfully, size:', buffer.length, 'bytes');

      return buffer;
    } catch (error) {
      console.error('❌ Error downloading file from Azure Blob Storage:', error);
      throw error;
    }
  }

  /**
   * Get a blob's public URL
   * @param {string} blobName - Blob name (path)
   * @returns {string} Blob URL
   */
  getBlobUrl(blobName) {
    if (!this.initialized) {
      return null;
    }
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    return blockBlobClient.url;
  }

  /**
   * Delete a file from Azure Blob Storage
   * @param {string} blobName - Blob name (path)
   * @returns {Promise<boolean>} Success status
   */
  async deleteFile(blobName) {
    try {
      if (!this.initialized) {
        const initResult = await this.initialize();
        if (!initResult) {
          throw new Error('Failed to initialize Azure Blob Storage');
        }
      }

      console.log('🗑️ Deleting file from Azure Blob Storage:', blobName);

      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.delete();

      console.log('✅ File deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Error deleting file from Azure Blob Storage:', error);
      throw error;
    }
  }

  /**
   * List all blobs for a specific user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} List of blob names
   */
  async listUserFiles(userId) {
    try {
      if (!this.initialized) {
        const initResult = await this.initialize();
        if (!initResult) {
          throw new Error('Failed to initialize Azure Blob Storage');
        }
      }

      const prefix = `user-${userId}/`;
      const blobs = [];

      for await (const blob of this.containerClient.listBlobsFlat({ prefix })) {
        blobs.push({
          name: blob.name,
          url: this.getBlobUrl(blob.name),
          createdOn: blob.properties.createdOn,
          contentLength: blob.properties.contentLength
        });
      }

      console.log(`📋 Found ${blobs.length} file(s) for user ${userId}`);
      return blobs;
    } catch (error) {
      console.error('❌ Error listing user files:', error);
      throw error;
    }
  }

  /**
   * Check if service is initialized
   * @returns {boolean} Initialization status
   */
  isInitialized() {
    return this.initialized;
  }
}

// Create singleton instance
const azureBlobService = new AzureBlobService();

export default azureBlobService;
