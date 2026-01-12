/**
 * Document Management Service
 * File upload, version control, and access management
 */

export interface Document {
  id: string;
  name: string;
  type: 'agenda' | 'minutes' | 'financial' | 'resolution' | 'proxy' | 'other';
  fileType: string; // pdf, docx, xlsx, etc.
  size: number; // in bytes
  uploadedBy: string;
  uploadedAt: string;
  lastModified: string;
  version: number;
  status: 'draft' | 'published' | 'archived';
  accessLevel: 'public' | 'members' | 'board' | 'admin';
  downloadCount: number;
  meetingId?: string;
  resolutionId?: string;
  tags: string[];
  versions: DocumentVersion[];
  url: string; // In production, this would be S3/Azure Blob URL
}

export interface DocumentVersion {
  version: number;
  uploadedBy: string;
  uploadedAt: string;
  size: number;
  changelog?: string;
  url: string;
}

class DocumentService {
  private readonly STORAGE_KEY = 'documents';

  /**
   * Upload document (simulated)
   */
  async uploadDocument(
    file: File,
    metadata: {
      type: Document['type'];
      accessLevel: Document['accessLevel'];
      meetingId?: string;
      resolutionId?: string;
      tags?: string[];
    },
    uploadedBy: string
  ): Promise<Document> {
    // In production, upload to Azure Blob Storage or S3
    const fileUrl = URL.createObjectURL(file);

    const document: Document = {
      id: this.generateId(),
      name: file.name,
      type: metadata.type,
      fileType: file.name.split('.').pop() || 'unknown',
      size: file.size,
      uploadedBy,
      uploadedAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      version: 1,
      status: 'published',
      accessLevel: metadata.accessLevel,
      downloadCount: 0,
      meetingId: metadata.meetingId,
      resolutionId: metadata.resolutionId,
      tags: metadata.tags || [],
      versions: [
        {
          version: 1,
          uploadedBy,
          uploadedAt: new Date().toISOString(),
          size: file.size,
          url: fileUrl,
        },
      ],
      url: fileUrl,
    };

    const documents = this.getAllDocuments();
    documents.push(document);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(documents));

    window.dispatchEvent(new CustomEvent('documentUploaded', { detail: document }));

    return document;
  }

  /**
   * Get all documents
   */
  getAllDocuments(): Document[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) {
      const dummyDocs = this.getDummyDocuments();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dummyDocs));
      return dummyDocs;
    }
    return JSON.parse(data);
  }

  /**
   * Get document by ID
   */
  getDocumentById(id: string): Document | null {
    const documents = this.getAllDocuments();
    return documents.find(d => d.id === id) || null;
  }

  /**
   * Get documents by type
   */
  getDocumentsByType(type: Document['type']): Document[] {
    return this.getAllDocuments().filter(d => d.type === type);
  }

  /**
   * Get documents by meeting
   */
  getDocumentsByMeeting(meetingId: string): Document[] {
    return this.getAllDocuments().filter(d => d.meetingId === meetingId);
  }

  /**
   * Search documents
   */
  searchDocuments(query: string): Document[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllDocuments().filter(
      d =>
        d.name.toLowerCase().includes(lowerQuery) ||
        d.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
        d.type.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Upload new version of document
   */
  async uploadNewVersion(
    documentId: string,
    file: File,
    uploadedBy: string,
    changelog?: string
  ): Promise<Document> {
    const documents = this.getAllDocuments();
    const document = documents.find(d => d.id === documentId);

    if (!document) {
      throw new Error('Document not found');
    }

    const fileUrl = URL.createObjectURL(file);
    const newVersion = document.version + 1;

    const versionInfo: DocumentVersion = {
      version: newVersion,
      uploadedBy,
      uploadedAt: new Date().toISOString(),
      size: file.size,
      changelog,
      url: fileUrl,
    };

    document.versions.push(versionInfo);
    document.version = newVersion;
    document.lastModified = new Date().toISOString();
    document.url = fileUrl;
    document.size = file.size;

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(documents));

    window.dispatchEvent(new CustomEvent('documentVersionUploaded', { detail: document }));

    return document;
  }

  /**
   * Download document (increment counter)
   */
  downloadDocument(documentId: string): void {
    const documents = this.getAllDocuments();
    const document = documents.find(d => d.id === documentId);

    if (document) {
      document.downloadCount++;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(documents));

      // In production, trigger actual download from cloud storage
      window.open(document.url, '_blank');
    }
  }

  /**
   * Delete document
   */
  deleteDocument(documentId: string): boolean {
    const documents = this.getAllDocuments();
    const filteredDocuments = documents.filter(d => d.id !== documentId);

    if (filteredDocuments.length < documents.length) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredDocuments));
      window.dispatchEvent(new CustomEvent('documentDeleted', { detail: { documentId } }));
      return true;
    }

    return false;
  }

  /**
   * Update document metadata
   */
  updateDocument(
    documentId: string,
    updates: Partial<Pick<Document, 'name' | 'type' | 'accessLevel' | 'status' | 'tags'>>
  ): Document | null {
    const documents = this.getAllDocuments();
    const document = documents.find(d => d.id === documentId);

    if (!document) return null;

    Object.assign(document, updates);
    document.lastModified = new Date().toISOString();

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(documents));

    window.dispatchEvent(new CustomEvent('documentUpdated', { detail: document }));

    return document;
  }

  /**
   * Get document statistics
   */
  getDocumentStats() {
    const documents = this.getAllDocuments();

    const stats = {
      total: documents.length,
      byType: {
        agenda: 0,
        minutes: 0,
        financial: 0,
        resolution: 0,
        proxy: 0,
        other: 0,
      },
      byStatus: {
        draft: 0,
        published: 0,
        archived: 0,
      },
      totalSize: 0,
      totalDownloads: 0,
      recentUploads: documents.filter(d => {
        const uploadDate = new Date(d.uploadedAt);
        const daysSince = (Date.now() - uploadDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 7;
      }).length,
    };

    documents.forEach(doc => {
      stats.byType[doc.type]++;
      stats.byStatus[doc.status]++;
      stats.totalSize += doc.size;
      stats.totalDownloads += doc.downloadCount;
    });

    return stats;
  }

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return 'DOC-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get dummy documents
   */
  private getDummyDocuments(): Document[] {
    return [
      {
        id: 'DOC-001',
        name: 'AGM Agenda 2025.pdf',
        type: 'agenda',
        fileType: 'pdf',
        size: 245678,
        uploadedBy: 'Admin User',
        uploadedAt: '2025-11-15T10:00:00Z',
        lastModified: '2025-11-15T10:00:00Z',
        version: 1,
        status: 'published',
        accessLevel: 'members',
        downloadCount: 47,
        meetingId: 'MTG-001',
        tags: ['AGM', '2025', 'agenda'],
        versions: [
          {
            version: 1,
            uploadedBy: 'Admin User',
            uploadedAt: '2025-11-15T10:00:00Z',
            size: 245678,
            url: '/documents/agm-agenda-2025.pdf',
          },
        ],
        url: '/documents/agm-agenda-2025.pdf',
      },
      {
        id: 'DOC-002',
        name: 'Financial Report Q4 2024.pdf',
        type: 'financial',
        fileType: 'pdf',
        size: 1250000,
        uploadedBy: 'CFO',
        uploadedAt: '2025-11-20T14:30:00Z',
        lastModified: '2025-11-22T16:45:00Z',
        version: 2,
        status: 'published',
        accessLevel: 'board',
        downloadCount: 23,
        meetingId: 'MTG-001',
        tags: ['financial', 'Q4', '2024'],
        versions: [
          {
            version: 1,
            uploadedBy: 'CFO',
            uploadedAt: '2025-11-20T14:30:00Z',
            size: 1200000,
            url: '/documents/financial-q4-v1.pdf',
          },
          {
            version: 2,
            uploadedBy: 'CFO',
            uploadedAt: '2025-11-22T16:45:00Z',
            size: 1250000,
            changelog: 'Updated revenue figures',
            url: '/documents/financial-q4-v2.pdf',
          },
        ],
        url: '/documents/financial-q4-v2.pdf',
      },
      {
        id: 'DOC-003',
        name: 'Proxy Form 2025.docx',
        type: 'proxy',
        fileType: 'docx',
        size: 85000,
        uploadedBy: 'Legal Team',
        uploadedAt: '2025-11-01T09:00:00Z',
        lastModified: '2025-11-01T09:00:00Z',
        version: 1,
        status: 'published',
        accessLevel: 'public',
        downloadCount: 156,
        tags: ['proxy', 'form', '2025'],
        versions: [
          {
            version: 1,
            uploadedBy: 'Legal Team',
            uploadedAt: '2025-11-01T09:00:00Z',
            size: 85000,
            url: '/documents/proxy-form-2025.docx',
          },
        ],
        url: '/documents/proxy-form-2025.docx',
      },
      {
        id: 'DOC-004',
        name: 'Board Resolution Draft.pdf',
        type: 'resolution',
        fileType: 'pdf',
        size: 125000,
        uploadedBy: 'Board Secretary',
        uploadedAt: '2025-12-01T11:00:00Z',
        lastModified: '2025-12-05T14:20:00Z',
        version: 3,
        status: 'draft',
        accessLevel: 'board',
        downloadCount: 8,
        resolutionId: 'RES-001',
        tags: ['resolution', 'draft', 'governance'],
        versions: [
          {
            version: 1,
            uploadedBy: 'Board Secretary',
            uploadedAt: '2025-12-01T11:00:00Z',
            size: 100000,
            url: '/documents/resolution-v1.pdf',
          },
          {
            version: 2,
            uploadedBy: 'Board Secretary',
            uploadedAt: '2025-12-03T10:00:00Z',
            size: 115000,
            changelog: 'Added legal review comments',
            url: '/documents/resolution-v2.pdf',
          },
          {
            version: 3,
            uploadedBy: 'Board Secretary',
            uploadedAt: '2025-12-05T14:20:00Z',
            size: 125000,
            changelog: 'Final draft with board feedback',
            url: '/documents/resolution-v3.pdf',
          },
        ],
        url: '/documents/resolution-v3.pdf',
      },
    ];
  }
}

export const documentService = new DocumentService();
