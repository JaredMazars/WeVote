/**
 * Advanced Search & Filter Service
 * Global search across all modules with saved searches
 */

export type SearchableEntity = 'candidates' | 'resolutions' | 'meetings' | 'documents' | 'questions' | 'users' | 'votes';

export interface SearchResult {
  id: string;
  type: SearchableEntity;
  title: string;
  description: string;
  url: string;
  relevance: number;
  highlightedText?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
}

export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  query: string;
  filters: SearchFilters;
  createdAt: string;
  lastUsed: string;
  useCount: number;
}

export interface SearchFilters {
  entityTypes?: SearchableEntity[];
  dateFrom?: string;
  dateTo?: string;
  status?: string[];
  tags?: string[];
  createdBy?: string;
  sortBy?: 'relevance' | 'date' | 'title';
  sortOrder?: 'asc' | 'desc';
}

class SearchService {
  private readonly SAVED_SEARCHES_KEY = 'savedSearches';
  private readonly SEARCH_HISTORY_KEY = 'searchHistory';

  /**
   * Perform global search
   */
  search(query: string, filters?: SearchFilters): SearchResult[] {
    if (!query.trim()) return [];

    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    // Search candidates
    if (!filters?.entityTypes || filters.entityTypes.includes('candidates')) {
      results.push(...this.searchCandidates(lowerQuery));
    }

    // Search resolutions
    if (!filters?.entityTypes || filters.entityTypes.includes('resolutions')) {
      results.push(...this.searchResolutions(lowerQuery));
    }

    // Search meetings
    if (!filters?.entityTypes || filters.entityTypes.includes('meetings')) {
      results.push(...this.searchMeetings(lowerQuery));
    }

    // Search documents
    if (!filters?.entityTypes || filters.entityTypes.includes('documents')) {
      results.push(...this.searchDocuments(lowerQuery));
    }

    // Search questions
    if (!filters?.entityTypes || filters.entityTypes.includes('questions')) {
      results.push(...this.searchQuestions(lowerQuery));
    }

    // Apply date filters
    let filteredResults = results;
    if (filters?.dateFrom) {
      filteredResults = filteredResults.filter(r => 
        !r.createdAt || new Date(r.createdAt) >= new Date(filters.dateFrom!)
      );
    }
    if (filters?.dateTo) {
      filteredResults = filteredResults.filter(r => 
        !r.createdAt || new Date(r.createdAt) <= new Date(filters.dateTo!)
      );
    }

    // Sort results
    const sortBy = filters?.sortBy || 'relevance';
    const sortOrder = filters?.sortOrder || 'desc';

    filteredResults.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'relevance') {
        comparison = b.relevance - a.relevance;
      } else if (sortBy === 'date') {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        comparison = dateB - dateA;
      } else if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      }

      return sortOrder === 'asc' ? -comparison : comparison;
    });

    // Save to search history
    this.saveToHistory(query);

    return filteredResults;
  }

  /**
   * Save search for later
   */
  saveSearch(userId: string, name: string, query: string, filters: SearchFilters): SavedSearch {
    const savedSearch: SavedSearch = {
      id: this.generateId(),
      userId,
      name,
      query,
      filters,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      useCount: 0,
    };

    const searches = this.getSavedSearches(userId);
    searches.push(savedSearch);
    localStorage.setItem(this.SAVED_SEARCHES_KEY, JSON.stringify(searches));

    return savedSearch;
  }

  /**
   * Get saved searches for user
   */
  getSavedSearches(userId: string): SavedSearch[] {
    const data = localStorage.getItem(this.SAVED_SEARCHES_KEY);
    if (!data) return [];
    
    const allSearches: SavedSearch[] = JSON.parse(data);
    return allSearches.filter(s => s.userId === userId);
  }

  /**
   * Execute saved search
   */
  executeSavedSearch(searchId: string): SearchResult[] {
    const allSearches: SavedSearch[] = JSON.parse(localStorage.getItem(this.SAVED_SEARCHES_KEY) || '[]');
    const savedSearch = allSearches.find(s => s.id === searchId);

    if (!savedSearch) return [];

    // Update usage stats
    savedSearch.lastUsed = new Date().toISOString();
    savedSearch.useCount++;
    localStorage.setItem(this.SAVED_SEARCHES_KEY, JSON.stringify(allSearches));

    return this.search(savedSearch.query, savedSearch.filters);
  }

  /**
   * Delete saved search
   */
  deleteSavedSearch(searchId: string): void {
    const allSearches: SavedSearch[] = JSON.parse(localStorage.getItem(this.SAVED_SEARCHES_KEY) || '[]');
    const filtered = allSearches.filter(s => s.id !== searchId);
    localStorage.setItem(this.SAVED_SEARCHES_KEY, JSON.stringify(filtered));
  }

  /**
   * Get search history
   */
  getSearchHistory(userId: string, limit = 10): string[] {
    const data = localStorage.getItem(this.SEARCH_HISTORY_KEY);
    if (!data) return [];
    
    const history: { userId: string; query: string; timestamp: string }[] = JSON.parse(data);
    return history
      .filter(h => h.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
      .map(h => h.query);
  }

  /**
   * Clear search history
   */
  clearSearchHistory(userId: string): void {
    const data = localStorage.getItem(this.SEARCH_HISTORY_KEY);
    if (!data) return;
    
    const history: { userId: string; query: string; timestamp: string }[] = JSON.parse(data);
    const filtered = history.filter(h => h.userId !== userId);
    localStorage.setItem(this.SEARCH_HISTORY_KEY, JSON.stringify(filtered));
  }

  /**
   * Search candidates
   */
  private searchCandidates(query: string): SearchResult[] {
    // Dummy candidate data
    const candidates = [
      { id: '1', name: 'Sarah Johnson', bio: 'Senior Director with 15 years experience' },
      { id: '2', name: 'Michael Chen', bio: 'Technology leader and innovator' },
      { id: '3', name: 'Emily Davis', bio: 'Financial expert and strategist' },
    ];

    return candidates
      .filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.bio.toLowerCase().includes(query)
      )
      .map(c => ({
        id: c.id,
        type: 'candidates' as SearchableEntity,
        title: c.name,
        description: c.bio,
        url: `/voting/candidate/${c.id}`,
        relevance: this.calculateRelevance(query, c.name + ' ' + c.bio),
      }));
  }

  /**
   * Search resolutions
   */
  private searchResolutions(query: string): SearchResult[] {
    const resolutions = [
      { id: '1', title: 'Approve FY2026 Budget', description: 'Annual budget approval for fiscal year 2026' },
      { id: '2', title: 'Amendment to Bylaws', description: 'Proposed changes to corporate governance bylaws' },
      { id: '3', title: 'Employee Stock Option Plan', description: 'New ESOP for employee retention' },
    ];

    return resolutions
      .filter(r => 
        r.title.toLowerCase().includes(query) || 
        r.description.toLowerCase().includes(query)
      )
      .map(r => ({
        id: r.id,
        type: 'resolutions' as SearchableEntity,
        title: r.title,
        description: r.description,
        url: `/voting/resolution/${r.id}`,
        relevance: this.calculateRelevance(query, r.title + ' ' + r.description),
      }));
  }

  /**
   * Search meetings
   */
  private searchMeetings(query: string): SearchResult[] {
    const meetings = [
      { id: 'MTG-001', title: 'Annual General Meeting 2025', description: 'AGM with elections and resolutions' },
      { id: 'MTG-002', title: 'Q4 Board Meeting', description: 'Quarterly board meeting' },
    ];

    return meetings
      .filter(m => 
        m.title.toLowerCase().includes(query) || 
        m.description.toLowerCase().includes(query)
      )
      .map(m => ({
        id: m.id,
        type: 'meetings' as SearchableEntity,
        title: m.title,
        description: m.description,
        url: `/meetings/${m.id}`,
        relevance: this.calculateRelevance(query, m.title + ' ' + m.description),
      }));
  }

  /**
   * Search documents
   */
  private searchDocuments(query: string): SearchResult[] {
    const documents = [
      { id: 'DOC-001', name: 'AGM Agenda 2025.pdf', type: 'agenda' },
      { id: 'DOC-002', name: 'Financial Report Q4 2024.pdf', type: 'financial' },
      { id: 'DOC-003', name: 'Proxy Form 2025.docx', type: 'proxy' },
    ];

    return documents
      .filter(d => 
        d.name.toLowerCase().includes(query) || 
        d.type.toLowerCase().includes(query)
      )
      .map(d => ({
        id: d.id,
        type: 'documents' as SearchableEntity,
        title: d.name,
        description: `${d.type} document`,
        url: `/documents/${d.id}`,
        relevance: this.calculateRelevance(query, d.name + ' ' + d.type),
      }));
  }

  /**
   * Search questions
   */
  private searchQuestions(query: string): SearchResult[] {
    const questions = [
      { id: 'Q-001', question: 'What are the revenue growth projections for Q1 2026?', category: 'financial' },
      { id: 'Q-002', question: 'How will the company ensure ESG compliance?', category: 'governance' },
    ];

    return questions
      .filter(q => 
        q.question.toLowerCase().includes(query) || 
        q.category.toLowerCase().includes(query)
      )
      .map(q => ({
        id: q.id,
        type: 'questions' as SearchableEntity,
        title: q.question,
        description: `${q.category} question`,
        url: `/qa/${q.id}`,
        relevance: this.calculateRelevance(query, q.question + ' ' + q.category),
      }));
  }

  /**
   * Calculate relevance score
   */
  private calculateRelevance(query: string, text: string): number {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    
    // Exact match gets highest score
    if (lowerText.includes(lowerQuery)) {
      const position = lowerText.indexOf(lowerQuery);
      // Earlier in text = higher score
      return 100 - (position / lowerText.length) * 20;
    }

    // Word match
    const queryWords = lowerQuery.split(' ');
    const textWords = lowerText.split(' ');
    const matches = queryWords.filter(qw => textWords.some(tw => tw.includes(qw)));
    
    return (matches.length / queryWords.length) * 50;
  }

  /**
   * Save query to history
   */
  private saveToHistory(query: string): void {
    const userId = 'USR-001'; // In production, get from auth context
    const data = localStorage.getItem(this.SEARCH_HISTORY_KEY);
    const history: { userId: string; query: string; timestamp: string }[] = data ? JSON.parse(data) : [];

    // Don't save duplicates
    if (history.some(h => h.userId === userId && h.query === query)) {
      return;
    }

    history.push({
      userId,
      query,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 50 searches per user
    const userHistory = history.filter(h => h.userId === userId);
    if (userHistory.length > 50) {
      const toRemove = userHistory.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )[0];
      const index = history.indexOf(toRemove);
      history.splice(index, 1);
    }

    localStorage.setItem(this.SEARCH_HISTORY_KEY, JSON.stringify(history));
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return 'SEARCH-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }
}

export const searchService = new SearchService();
