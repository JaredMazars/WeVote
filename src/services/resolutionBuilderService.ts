/**
 * Resolution Builder Service
 * Template-based resolution creation with drag-drop interface support
 */

export type ResolutionType = 'ordinary' | 'special';
export type ResolutionStatus = 'draft' | 'pending_review' | 'approved' | 'published' | 'voting' | 'passed' | 'failed' | 'archived';

export interface Resolution {
  id: string;
  title: string;
  description: string;
  type: ResolutionType;
  status: ResolutionStatus;
  majorityRequired: number; // Percentage
  sections: ResolutionSection[];
  createdBy: string;
  createdAt: string;
  lastModified: string;
  publishedAt?: string;
  votingStartDate?: string;
  votingEndDate?: string;
  financialImpact?: FinancialImpact;
  attachments: string[];
  tags: string[];
  version: number;
}

export interface ResolutionSection {
  id: string;
  order: number;
  type: 'header' | 'paragraph' | 'whereas' | 'resolved' | 'numbered_list' | 'bullet_list';
  content: string;
  editable: boolean;
}

export interface FinancialImpact {
  estimatedCost: number;
  estimatedRevenue: number;
  netImpact: number;
  currency: string;
  timeframe: string;
  notes: string;
}

export interface ResolutionTemplate {
  id: string;
  name: string;
  description: string;
  category: 'governance' | 'financial' | 'operational' | 'legal' | 'other';
  type: ResolutionType;
  sections: ResolutionSection[];
  icon: string;
}

class ResolutionBuilderService {
  private readonly STORAGE_KEY = 'resolutions';
  private readonly TEMPLATES_KEY = 'resolutionTemplates';

  /**
   * Create resolution from template
   */
  createFromTemplate(templateId: string, createdBy: string): Resolution {
    const template = this.getTemplateById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const resolution: Resolution = {
      id: this.generateId(),
      title: `New ${template.name}`,
      description: template.description,
      type: template.type,
      status: 'draft',
      majorityRequired: template.type === 'special' ? 75 : 50,
      sections: template.sections.map((s, index) => ({
        ...s,
        id: `SECT-${Date.now()}-${index}`,
        editable: true,
      })),
      createdBy,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      attachments: [],
      tags: [template.category],
      version: 1,
    };

    const resolutions = this.getAllResolutions();
    resolutions.push(resolution);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(resolutions));

    window.dispatchEvent(new CustomEvent('resolutionCreated', { detail: resolution }));

    return resolution;
  }

  /**
   * Create blank resolution
   */
  createBlank(createdBy: string, type: ResolutionType = 'ordinary'): Resolution {
    const resolution: Resolution = {
      id: this.generateId(),
      title: 'New Resolution',
      description: '',
      type,
      status: 'draft',
      majorityRequired: type === 'special' ? 75 : 50,
      sections: [
        {
          id: 'SECT-1',
          order: 1,
          type: 'header',
          content: 'Resolution Title',
          editable: true,
        },
        {
          id: 'SECT-2',
          order: 2,
          type: 'paragraph',
          content: 'Enter resolution description...',
          editable: true,
        },
      ],
      createdBy,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      attachments: [],
      tags: [],
      version: 1,
    };

    const resolutions = this.getAllResolutions();
    resolutions.push(resolution);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(resolutions));

    return resolution;
  }

  /**
   * Update resolution
   */
  updateResolution(resolutionId: string, updates: Partial<Resolution>): Resolution | null {
    const resolutions = this.getAllResolutions();
    const resolution = resolutions.find(r => r.id === resolutionId);

    if (!resolution) return null;

    Object.assign(resolution, updates);
    resolution.lastModified = new Date().toISOString();

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(resolutions));

    window.dispatchEvent(new CustomEvent('resolutionUpdated', { detail: resolution }));

    return resolution;
  }

  /**
   * Add section to resolution
   */
  addSection(
    resolutionId: string,
    type: ResolutionSection['type'],
    content: string,
    position?: number
  ): Resolution | null {
    const resolution = this.getResolutionById(resolutionId);
    if (!resolution) return null;

    const newSection: ResolutionSection = {
      id: this.generateId(),
      order: position !== undefined ? position : resolution.sections.length + 1,
      type,
      content,
      editable: true,
    };

    // Insert at position
    if (position !== undefined) {
      resolution.sections.splice(position - 1, 0, newSection);
      // Reorder subsequent sections
      resolution.sections.forEach((s, index) => {
        s.order = index + 1;
      });
    } else {
      resolution.sections.push(newSection);
    }

    return this.updateResolution(resolutionId, { sections: resolution.sections });
  }

  /**
   * Update section
   */
  updateSection(resolutionId: string, sectionId: string, content: string): Resolution | null {
    const resolution = this.getResolutionById(resolutionId);
    if (!resolution) return null;

    const section = resolution.sections.find(s => s.id === sectionId);
    if (!section) return null;

    section.content = content;
    return this.updateResolution(resolutionId, { sections: resolution.sections });
  }

  /**
   * Delete section
   */
  deleteSection(resolutionId: string, sectionId: string): Resolution | null {
    const resolution = this.getResolutionById(resolutionId);
    if (!resolution) return null;

    resolution.sections = resolution.sections.filter(s => s.id !== sectionId);
    
    // Reorder
    resolution.sections.forEach((s, index) => {
      s.order = index + 1;
    });

    return this.updateResolution(resolutionId, { sections: resolution.sections });
  }

  /**
   * Reorder sections (drag-drop support)
   */
  reorderSections(resolutionId: string, sectionIds: string[]): Resolution | null {
    const resolution = this.getResolutionById(resolutionId);
    if (!resolution) return null;

    const reorderedSections = sectionIds.map((id, index) => {
      const section = resolution.sections.find(s => s.id === id);
      if (section) {
        section.order = index + 1;
        return section;
      }
      return null;
    }).filter(s => s !== null) as ResolutionSection[];

    return this.updateResolution(resolutionId, { sections: reorderedSections });
  }

  /**
   * Set financial impact
   */
  setFinancialImpact(resolutionId: string, impact: FinancialImpact): Resolution | null {
    return this.updateResolution(resolutionId, { financialImpact: impact });
  }

  /**
   * Publish resolution
   */
  publishResolution(resolutionId: string, votingStartDate: string, votingEndDate: string): Resolution | null {
    return this.updateResolution(resolutionId, {
      status: 'published',
      publishedAt: new Date().toISOString(),
      votingStartDate,
      votingEndDate,
    });
  }

  /**
   * Get all resolutions
   */
  getAllResolutions(): Resolution[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) {
      const dummyResolutions = this.getDummyResolutions();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dummyResolutions));
      return dummyResolutions;
    }
    return JSON.parse(data);
  }

  /**
   * Get resolution by ID
   */
  getResolutionById(id: string): Resolution | null {
    const resolutions = this.getAllResolutions();
    return resolutions.find(r => r.id === id) || null;
  }

  /**
   * Get all templates
   */
  getAllTemplates(): ResolutionTemplate[] {
    const data = localStorage.getItem(this.TEMPLATES_KEY);
    if (!data) {
      const templates = this.getDefaultTemplates();
      localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(templates));
      return templates;
    }
    return JSON.parse(data);
  }

  /**
   * Get template by ID
   */
  getTemplateById(id: string): ResolutionTemplate | null {
    const templates = this.getAllTemplates();
    return templates.find(t => t.id === id) || null;
  }

  /**
   * Generate ID
   */
  private generateId(): string {
    return 'RES-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get default templates
   */
  private getDefaultTemplates(): ResolutionTemplate[] {
    return [
      {
        id: 'TPL-001',
        name: 'Budget Approval',
        description: 'Standard template for annual budget approval',
        category: 'financial',
        type: 'ordinary',
        icon: '💰',
        sections: [
          { id: '1', order: 1, type: 'header', content: 'Resolution to Approve Annual Budget', editable: true },
          { id: '2', order: 2, type: 'whereas', content: 'WHEREAS, the Board of Directors has reviewed the proposed budget for the fiscal year;', editable: true },
          { id: '3', order: 3, type: 'whereas', content: 'WHEREAS, the proposed budget supports the strategic objectives of the organization;', editable: true },
          { id: '4', order: 4, type: 'resolved', content: 'RESOLVED, that the annual budget for fiscal year [YEAR] in the amount of [AMOUNT] is hereby approved.', editable: true },
        ],
      },
      {
        id: 'TPL-002',
        name: 'Bylaw Amendment',
        description: 'Template for amending corporate bylaws',
        category: 'governance',
        type: 'special',
        icon: '📜',
        sections: [
          { id: '1', order: 1, type: 'header', content: 'Resolution to Amend Bylaws', editable: true },
          { id: '2', order: 2, type: 'whereas', content: 'WHEREAS, the current bylaws require amendment to reflect current practices;', editable: true },
          { id: '3', order: 3, type: 'resolved', content: 'RESOLVED, that Article [NUMBER], Section [NUMBER] of the Bylaws be amended to read as follows:', editable: true },
          { id: '4', order: 4, type: 'paragraph', content: '[Enter new bylaw text here]', editable: true },
        ],
      },
      {
        id: 'TPL-003',
        name: 'Board Appointment',
        description: 'Template for appointing board members',
        category: 'governance',
        type: 'ordinary',
        icon: '👤',
        sections: [
          { id: '1', order: 1, type: 'header', content: 'Resolution to Appoint Board Member', editable: true },
          { id: '2', order: 2, type: 'whereas', content: 'WHEREAS, a vacancy exists on the Board of Directors;', editable: true },
          { id: '3', order: 3, type: 'whereas', content: 'WHEREAS, [CANDIDATE NAME] possesses the qualifications necessary for board service;', editable: true },
          { id: '4', order: 4, type: 'resolved', content: 'RESOLVED, that [CANDIDATE NAME] is hereby appointed to the Board of Directors for a term of [YEARS] years.', editable: true },
        ],
      },
    ];
  }

  /**
   * Get dummy resolutions
   */
  private getDummyResolutions(): Resolution[] {
    return [
      {
        id: 'RES-001',
        title: 'Approve FY2026 Budget',
        description: 'Resolution to approve the annual budget for fiscal year 2026',
        type: 'ordinary',
        status: 'voting',
        majorityRequired: 50,
        sections: [
          { id: 'S1', order: 1, type: 'header', content: 'Resolution to Approve FY2026 Budget', editable: false },
          { id: 'S2', order: 2, type: 'whereas', content: 'WHEREAS, the Board has reviewed the proposed budget;', editable: false },
          { id: 'S3', order: 3, type: 'resolved', content: 'RESOLVED, that the FY2026 budget of $5.2M is approved.', editable: false },
        ],
        createdBy: 'Board Secretary',
        createdAt: '2025-11-01T10:00:00Z',
        lastModified: '2025-11-15T14:30:00Z',
        publishedAt: '2025-11-20T09:00:00Z',
        votingStartDate: '2025-12-01T00:00:00Z',
        votingEndDate: '2025-12-15T23:59:59Z',
        financialImpact: {
          estimatedCost: 5200000,
          estimatedRevenue: 6500000,
          netImpact: 1300000,
          currency: 'USD',
          timeframe: 'FY2026',
          notes: 'Projected growth of 15%',
        },
        attachments: ['DOC-002'],
        tags: ['budget', 'financial', '2026'],
        version: 1,
      },
    ];
  }
}

export const resolutionBuilderService = new ResolutionBuilderService();
