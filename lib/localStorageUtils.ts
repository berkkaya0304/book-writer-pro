// Client-side LocalStorage utility for data persistence

export type Book = { id: string; title: string; createdAt: string; };
export type TechnicalStatus = 'Draft' | 'Under Review' | 'Verified';
export type Chapter = { id: string; bookId: string; title: string; outline: string; content: string; order: number; status?: string; technicalStatus?: TechnicalStatus; createdAt: string; };
export type Snapshot = { id: string; chapterId: string; name?: string; content: string; createdAt: string; };
export type WordCountGoal = { target: number; dailyProgress: Record<string, number> };

export type Footnote = { id: string; chapterId: string; number: number; text: string; createdAt: string; };
export type Abbreviation = { id: string; term: string; definition: string; createdAt: string; };
export type ErrataItem = { id: string; version: string; chapterId?: string; description: string; status: 'Open' | 'Fixed'; createdAt: string; };
export type Annotation = { id: string; chapterId: string; quote: string; note: string; createdAt: string; };

export type PeerReview = { id: string; chapterId: string; author: string; comment: string; status: 'Open' | 'Resolved' | 'Approved'; createdAt: string; };
export type CalendarItem = { id: string; chapterId: string; deadline: string; note: string; createdAt: string; };
export type CustomTemplate = { id: string; name: string; description: string; content: string; category: string; createdAt: string; isBuiltIn?: boolean; };

export type RelatedWork = {
  id: string;
  title: string;
  authors: string;
  year: string;
  venue: string;
  similarity: number; // 1-5
  notes: string;
  tags: string[];
  createdAt: string;
};

export type CaptionType = 'figure' | 'table';
export type Caption = {
  id: string;
  type: CaptionType;
  number: number;
  title: string;
  description: string;
  chapterId: string;
  createdAt: string;
};

export type ReproducibilityItem = {
  id: string;
  category: string;
  label: string;
  checked: boolean;
  notes: string;
};

export type ContributionRole = {
  role: string;
  authors: string[];
};

export type EthicsAnswer = {
  section: string;
  question: string;
  answer: 'yes' | 'no' | 'na' | '';
  explanation: string;
};

export type ReferenceType = 'book' | 'article' | 'website' | 'journal';
export type Reference = {
  id: string;
  type: ReferenceType;
  title: string;
  authors: string;      // Comma-separated
  year: string;
  publisher?: string;   // For books
  url?: string;         // For websites
  journal?: string;     // For journal/article
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  createdAt: string;
};

export type ReaderProfile = {
  ageRange: string;       // e.g. '18-25', '26-35', '36-50', '50+'
  readingLevel: string;   // 'Beginner' | 'Intermediate' | 'Advanced'
  interests: string[];    // Tags: ['Fantasy', 'Science', ...]
  goals: string;          // Free text
  preferredLanguage: string;
};

const STORAGE_KEY = "book-writer-data";

export interface AppData {
  activeBookId: string;
  books: Book[];
  chapters: Chapter[];
  snapshots: Snapshot[];
  settings: {
    theme: string;
    model: string;
    language: string;
    tone: string;
    fontFamily?: string;
    fontSize?: number;
    lineHeight?: number;
  };
  goals: WordCountGoal;
  scratchpad: string;
  references: Reference[];
  readerProfile: ReaderProfile;
  footnotes: Footnote[];
  abbreviations: Abbreviation[];
  errata: ErrataItem[];
  annotations: Annotation[];
  peerReviews: PeerReview[];
  calendarItems: CalendarItem[];
  customTemplates: CustomTemplate[];
  relatedWorks: RelatedWork[];
  captions: Caption[];
  reproducibilityItems: ReproducibilityItem[];
  contributionRoles: ContributionRole[];
  ethicsAnswers: EthicsAnswer[];
}

const defaultData: AppData = {
  activeBookId: "default",
  books: [{ id: "default", title: "My First Book", createdAt: new Date().toISOString() }],
  chapters: [],
  snapshots: [],
  settings: {
    theme: "dark",
    model: "llama3",
    language: "English",
    tone: "Neutral",
    fontFamily: "var(--font-sans)",
    fontSize: 18,
    lineHeight: 1.8
  },
  goals: {
    target: 1000,
    dailyProgress: {}
  },
  scratchpad: "",
  references: [],
  readerProfile: {
    ageRange: "26-35",
    readingLevel: "Intermediate",
    interests: [],
    goals: "",
    preferredLanguage: "English"
  },
  footnotes: [],
  abbreviations: [],
  errata: [],
  annotations: [],
  peerReviews: [],
  calendarItems: [],
  customTemplates: [],
  relatedWorks: [],
  captions: [],
  reproducibilityItems: [],
  contributionRoles: [],
  ethicsAnswers: [],
};

export function getAppData(): AppData {
  if (typeof window === "undefined") return defaultData;
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return defaultData;
  try {
    const parsed = JSON.parse(data);
    // Backfill new fields for existing data
    if (!parsed.references) parsed.references = [];
    if (!parsed.readerProfile) parsed.readerProfile = defaultData.readerProfile;
    if (!parsed.footnotes) parsed.footnotes = [];
    if (!parsed.abbreviations) parsed.abbreviations = [];
    if (!parsed.errata) parsed.errata = [];
    if (!parsed.annotations) parsed.annotations = [];
    if (!parsed.peerReviews) parsed.peerReviews = [];
    if (!parsed.calendarItems) parsed.calendarItems = [];
    if (!parsed.customTemplates) parsed.customTemplates = [];
    if (!parsed.relatedWorks) parsed.relatedWorks = [];
    if (!parsed.captions) parsed.captions = [];
    if (!parsed.reproducibilityItems) parsed.reproducibilityItems = [];
    if (!parsed.contributionRoles) parsed.contributionRoles = [];
    if (!parsed.ethicsAnswers) parsed.ethicsAnswers = [];
    return parsed;
  } catch {
    return defaultData;
  }
}

export function saveAppData(data: AppData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ======================================
// Books API
// ======================================

export function getActiveBookId(): string {
  return getAppData().activeBookId;
}

export function setActiveBookId(id: string): void {
  const data = getAppData();
  data.activeBookId = id;
  saveAppData(data);
}

export function getAllBooks(): Book[] {
  return getAppData().books;
}

export function createBook(title: string): Book {
  const data = getAppData();
  const newBook: Book = {
    id: Date.now().toString(),
    title,
    createdAt: new Date().toISOString()
  };
  data.books.push(newBook);
  saveAppData(data);
  return newBook;
}

export function deleteBook(id: string): boolean {
  const data = getAppData();
  const initialLen = data.books.length;
  data.books = data.books.filter(b => b.id !== id);
  if (data.activeBookId === id) {
    data.activeBookId = data.books.length > 0 ? data.books[0].id : "default";
  }
  
  // also delete related chapters & snapshots
  data.chapters = data.chapters.filter(c => c.bookId !== id);
  
  saveAppData(data);
  return data.books.length < initialLen;
}


// ======================================
// Chapters API
// ======================================

export function getAllChapters(bookId?: string): Chapter[] {
  const activeId = bookId || getActiveBookId();
  const data = getAppData();
  return data.chapters.filter(c => c.bookId === activeId).sort((a, b) => a.order - b.order);
}

export function getChapter(id: string): Chapter | null {
  return getAppData().chapters.find(c => c.id === id) || null;
}

export function createChapter(chapterData: Partial<Chapter>, bookId?: string): Chapter {
  const data = getAppData();
  const currentBookId = bookId || data.activeBookId;
  
  const existingChapters = data.chapters.filter(c => c.bookId === currentBookId);
  const nextOrder = existingChapters.length > 0 ? Math.max(...existingChapters.map(c => c.order)) + 1 : 1;

  const newChapter: Chapter = {
    id: Date.now().toString(),
    bookId: currentBookId,
    title: chapterData.title || `Chapter ${nextOrder}`,
    outline: chapterData.outline || "",
    content: chapterData.content || "",
    order: chapterData.order || nextOrder,
    status: chapterData.status || "Idea",
    createdAt: new Date().toISOString()
  };

  data.chapters.push(newChapter);
  saveAppData(data);
  return newChapter;
}

export function updateChapter(id: string, updates: Partial<Chapter>): Chapter | null {
  const data = getAppData();
  const index = data.chapters.findIndex(c => c.id === id);
  if (index === -1) return null;

  data.chapters[index] = { ...data.chapters[index], ...updates };
  saveAppData(data);
  return data.chapters[index];
}

export function deleteChapter(id: string): boolean {
  const data = getAppData();
  const initialLen = data.chapters.length;
  data.chapters = data.chapters.filter(c => c.id !== id);
  // delete snapshots
  data.snapshots = data.snapshots.filter(s => s.chapterId !== id);
  saveAppData(data);
  return data.chapters.length < initialLen;
}


// ======================================
// Snapshots (History) API
// ======================================

export function getChapterHistory(chapterId: string): Snapshot[] {
  return getAppData().snapshots
    .filter(s => s.chapterId === chapterId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function createSnapshot(chapterId: string, content: string, name?: string): Snapshot {
  const data = getAppData();
  const newSnapshot: Snapshot = {
    id: Date.now().toString(),
    chapterId,
    content,
    name,
    createdAt: new Date().toISOString()
  };
  data.snapshots.push(newSnapshot);
  
  // Keep only the last 10 snapshots per chapter to prevent localstorage bloat
  const chapterSnapshots = data.snapshots.filter(s => s.chapterId === chapterId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (chapterSnapshots.length > 10) {
    const toKeep = new Set(data.snapshots.filter(s => s.chapterId !== chapterId).map(s => s.id));
    chapterSnapshots.slice(0, 10).forEach(s => toKeep.add(s.id));
    data.snapshots = data.snapshots.filter(s => toKeep.has(s.id));
  }
  
  saveAppData(data);
  return newSnapshot;
}


// ======================================
// Goals & Scratchpad API
// ======================================

export function getDailyWordCount(dateString: string): number {
  return getAppData().goals.dailyProgress[dateString] || 0;
}

export function updateDailyWordCount(dateString: string, wordsWrittenDelta: number): void {
  const data = getAppData();
  if (!data.goals.dailyProgress[dateString]) {
    data.goals.dailyProgress[dateString] = 0;
  }
  data.goals.dailyProgress[dateString] += wordsWrittenDelta;
  saveAppData(data);
}

export function getGoals(): WordCountGoal {
  return getAppData().goals;
}

export function updateGoals(target: number): void {
  const data = getAppData();
  data.goals.target = target;
  saveAppData(data);
}

export function getScratchpad(): string {
  return getAppData().scratchpad;
}

export function updateScratchpad(content: string): void {
  const data = getAppData();
  data.scratchpad = content;
  saveAppData(data);
}

export function getSettings() {
  return getAppData().settings;
}

export function updateSettings(updates: Partial<AppData['settings']>): void {
  const data = getAppData();
  data.settings = { ...data.settings, ...updates };
  saveAppData(data);
}


// ======================================
// References (Bibliography) API
// ======================================

export function getAllReferences(): Reference[] {
  return getAppData().references || [];
}

export function createReference(ref: Omit<Reference, 'id' | 'createdAt'>): Reference {
  const data = getAppData();
  const newRef: Reference = {
    ...ref,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  };
  if (!data.references) data.references = [];
  data.references.push(newRef);
  saveAppData(data);
  return newRef;
}

export function updateReference(id: string, updates: Partial<Reference>): Reference | null {
  const data = getAppData();
  if (!data.references) data.references = [];
  const index = data.references.findIndex(r => r.id === id);
  if (index === -1) return null;
  data.references[index] = { ...data.references[index], ...updates };
  saveAppData(data);
  return data.references[index];
}

export function deleteReference(id: string): boolean {
  const data = getAppData();
  if (!data.references) return false;
  const initialLen = data.references.length;
  data.references = data.references.filter(r => r.id !== id);
  saveAppData(data);
  return data.references.length < initialLen;
}


// ======================================
// Reader Profile API
// ======================================

export function getReaderProfile(): ReaderProfile {
  return getAppData().readerProfile || defaultData.readerProfile;
}

export function updateReaderProfile(updates: Partial<ReaderProfile>): void {
  const data = getAppData();
  data.readerProfile = { ...data.readerProfile, ...updates };
  saveAppData(data);
}

// Helper: build a citation string from a reference
export function formatCitation(ref: Reference, style: 'APA' | 'MLA' | 'Chicago' | 'IEEE' | 'ACS'): string {
  const authors = ref.authors || 'Unknown Author';
  const year = ref.year || 'n.d.';
  const title = ref.title || 'Untitled';

  switch (style) {
    case 'APA':
      if (ref.type === 'book') {
        return `${authors} (${year}). *${title}*. ${ref.publisher || ''}.`;
      } else if (ref.type === 'journal') {
        return `${authors} (${year}). ${title}. *${ref.journal}*, ${ref.volume || ''}(${ref.issue || ''}), ${ref.pages || ''}. ${ref.doi ? 'https://doi.org/' + ref.doi : ''}`;
      } else if (ref.type === 'website') {
        return `${authors} (${year}). ${title}. Retrieved from ${ref.url || ''}`;
      } else {
        return `${authors} (${year}). ${title}. ${ref.publisher || ref.journal || ''}.`;
      }
    case 'MLA':
      if (ref.type === 'book') {
        return `${authors}. *${title}*. ${ref.publisher || ''}, ${year}.`;
      } else if (ref.type === 'journal') {
        return `${authors}. "${title}." *${ref.journal}*, vol. ${ref.volume || ''}, no. ${ref.issue || ''}, ${year}, pp. ${ref.pages || ''}.`;
      } else if (ref.type === 'website') {
        return `${authors}. "${title}." ${year}, ${ref.url || ''}.`;
      } else {
        return `${authors}. "${title}." ${ref.publisher || ref.journal || ''}, ${year}.`;
      }
    case 'Chicago':
      if (ref.type === 'book') {
        return `${authors}. *${title}*. ${ref.publisher || ''}, ${year}.`;
      } else if (ref.type === 'journal') {
        return `${authors}. "${title}." *${ref.journal}* ${ref.volume || ''}${ref.issue ? ', no. ' + ref.issue : ''} (${year}): ${ref.pages || ''}.`;
      } else if (ref.type === 'website') {
        return `${authors}. "${title}." Accessed ${year}. ${ref.url || ''}.`;
      } else {
        return `${authors}. "${title}." ${ref.publisher || ref.journal || ''}, ${year}.`;
      }
    case 'IEEE': {
      const authorList = authors.split(',').map(a => a.trim());
      const authorStr = authorList.length > 3
        ? `${authorList[0]} et al.`
        : authorList.join(', ');
      if (ref.type === 'journal') {
        return `${authorStr}, "${title}," *${ref.journal}*, vol. ${ref.volume || '?'}, no. ${ref.issue || '?'}, pp. ${ref.pages || '?'}, ${year}.${ref.doi ? ' doi: ' + ref.doi + '.' : ''}`;
      } else if (ref.type === 'book') {
        return `${authorStr}, *${title}*. ${ref.publisher || ''}, ${year}.`;
      } else if (ref.type === 'website') {
        return `${authorStr}, "${title}," ${year}. [Online]. Available: ${ref.url || ''}. [Accessed: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}].`;
      } else {
        return `${authorStr}, "${title}," ${ref.publisher || ref.journal || ''}, ${year}.`;
      }
    }
    case 'ACS': {
      const authorList = authors.split(',').map(a => a.trim());
      const authorStr = authorList.length > 3
        ? `${authorList[0]}; et al.`
        : authorList.join('; ');
      if (ref.type === 'journal') {
        return `${authorStr} ${title}. *${ref.journal}* **${year}**, *${ref.volume || '?'}* (${ref.issue || '?'}), ${ref.pages || '?'}.${ref.doi ? ' DOI: ' + ref.doi + '.' : ''}`;
      } else if (ref.type === 'book') {
        return `${authorStr} *${title}*; ${ref.publisher || ''}: ${year}.`;
      } else {
        return `${authorStr} ${title}. ${ref.url || ''}, ${year}.`;
      }
    }
    default:
      return `${authors} (${year}). ${title}.`;
  }
}


// ======================================
// Related Works API
// ======================================

export function getAllRelatedWorks(): RelatedWork[] {
  return (getAppData().relatedWorks || []).sort((a, b) => Number(b.year) - Number(a.year));
}

export function createRelatedWork(work: Omit<RelatedWork, 'id' | 'createdAt'>): RelatedWork {
  const data = getAppData();
  const rw: RelatedWork = { ...work, id: Date.now().toString(), createdAt: new Date().toISOString() };
  if (!data.relatedWorks) data.relatedWorks = [];
  data.relatedWorks.push(rw);
  saveAppData(data);
  return rw;
}

export function updateRelatedWork(id: string, updates: Partial<RelatedWork>): void {
  const data = getAppData();
  const idx = (data.relatedWorks || []).findIndex(r => r.id === id);
  if (idx !== -1) { data.relatedWorks[idx] = { ...data.relatedWorks[idx], ...updates }; saveAppData(data); }
}

export function deleteRelatedWork(id: string): void {
  const data = getAppData();
  data.relatedWorks = (data.relatedWorks || []).filter(r => r.id !== id);
  saveAppData(data);
}


// ======================================
// Captions API
// ======================================

export function getAllCaptions(): Caption[] {
  return (getAppData().captions || []).sort((a, b) => a.type.localeCompare(b.type) || a.number - b.number);
}

export function createCaption(cap: Omit<Caption, 'id' | 'number' | 'createdAt'>): Caption {
  const data = getAppData();
  if (!data.captions) data.captions = [];
  const sameType = data.captions.filter(c => c.type === cap.type);
  const nextNum = sameType.length > 0 ? Math.max(...sameType.map(c => c.number)) + 1 : 1;
  const caption: Caption = { ...cap, id: Date.now().toString(), number: nextNum, createdAt: new Date().toISOString() };
  data.captions.push(caption);
  saveAppData(data);
  return caption;
}

export function updateCaption(id: string, updates: Partial<Caption>): void {
  const data = getAppData();
  const idx = (data.captions || []).findIndex(c => c.id === id);
  if (idx !== -1) { data.captions[idx] = { ...data.captions[idx], ...updates }; saveAppData(data); }
}

export function deleteCaption(id: string): void {
  const data = getAppData();
  const cap = (data.captions || []).find(c => c.id === id);
  data.captions = (data.captions || []).filter(c => c.id !== id);
  // Renumber items of same type
  if (cap) {
    let count = 1;
    data.captions
      .filter(c => c.type === cap.type)
      .sort((a, b) => a.number - b.number)
      .forEach(c => { c.number = count++; });
  }
  saveAppData(data);
}


// ======================================
// Reproducibility Checklist API
// ======================================

export function getReproducibilityItems(): ReproducibilityItem[] {
  return getAppData().reproducibilityItems || [];
}

export function saveReproducibilityItems(items: ReproducibilityItem[]): void {
  const data = getAppData();
  data.reproducibilityItems = items;
  saveAppData(data);
}


// ======================================
// Contribution Roles API
// ======================================

export function getContributionRoles(): ContributionRole[] {
  return getAppData().contributionRoles || [];
}

export function saveContributionRoles(roles: ContributionRole[]): void {
  const data = getAppData();
  data.contributionRoles = roles;
  saveAppData(data);
}


// ======================================
// Ethics Answers API
// ======================================

export function getEthicsAnswers(): EthicsAnswer[] {
  return getAppData().ethicsAnswers || [];
}

export function saveEthicsAnswers(answers: EthicsAnswer[]): void {
  const data = getAppData();
  data.ethicsAnswers = answers;
  saveAppData(data);
}


// ======================================
// Footnotes API
// ======================================

export function getFootnotesByChapter(chapterId: string): Footnote[] {
  return (getAppData().footnotes || [])
    .filter(f => f.chapterId === chapterId)
    .sort((a, b) => a.number - b.number);
}

export function getAllFootnotes(): Footnote[] {
  return (getAppData().footnotes || []).sort((a, b) => a.number - b.number);
}

export function createFootnote(chapterId: string, text: string): Footnote {
  const data = getAppData();
  const chapterFns = (data.footnotes || []).filter(f => f.chapterId === chapterId);
  const nextNum = chapterFns.length > 0 ? Math.max(...chapterFns.map(f => f.number)) + 1 : 1;
  const fn: Footnote = { id: Date.now().toString(), chapterId, number: nextNum, text, createdAt: new Date().toISOString() };
  if (!data.footnotes) data.footnotes = [];
  data.footnotes.push(fn);
  saveAppData(data);
  return fn;
}

export function updateFootnote(id: string, text: string): void {
  const data = getAppData();
  const idx = (data.footnotes || []).findIndex(f => f.id === id);
  if (idx !== -1) { data.footnotes[idx].text = text; saveAppData(data); }
}

export function deleteFootnote(id: string): void {
  const data = getAppData();
  data.footnotes = (data.footnotes || []).filter(f => f.id !== id);
  saveAppData(data);
}


// ======================================
// Abbreviations API
// ======================================

export function getAllAbbreviations(): Abbreviation[] {
  return (getAppData().abbreviations || []).sort((a, b) => a.term.localeCompare(b.term));
}

export function createAbbreviation(term: string, definition: string): Abbreviation {
  const data = getAppData();
  const abbr: Abbreviation = { id: Date.now().toString(), term, definition, createdAt: new Date().toISOString() };
  if (!data.abbreviations) data.abbreviations = [];
  data.abbreviations.push(abbr);
  saveAppData(data);
  return abbr;
}

export function updateAbbreviation(id: string, updates: Partial<Abbreviation>): void {
  const data = getAppData();
  const idx = (data.abbreviations || []).findIndex(a => a.id === id);
  if (idx !== -1) { data.abbreviations[idx] = { ...data.abbreviations[idx], ...updates }; saveAppData(data); }
}

export function deleteAbbreviation(id: string): void {
  const data = getAppData();
  data.abbreviations = (data.abbreviations || []).filter(a => a.id !== id);
  saveAppData(data);
}


// ======================================
// Errata API
// ======================================

export function getAllErrata(): ErrataItem[] {
  return (getAppData().errata || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function createErrataItem(item: Omit<ErrataItem, 'id' | 'createdAt'>): ErrataItem {
  const data = getAppData();
  const entry: ErrataItem = { ...item, id: Date.now().toString(), createdAt: new Date().toISOString() };
  if (!data.errata) data.errata = [];
  data.errata.push(entry);
  saveAppData(data);
  return entry;
}

export function updateErrataItem(id: string, updates: Partial<ErrataItem>): void {
  const data = getAppData();
  const idx = (data.errata || []).findIndex(e => e.id === id);
  if (idx !== -1) { data.errata[idx] = { ...data.errata[idx], ...updates }; saveAppData(data); }
}

export function deleteErrataItem(id: string): void {
  const data = getAppData();
  data.errata = (data.errata || []).filter(e => e.id !== id);
  saveAppData(data);
}


// ======================================
// Annotations API
// ======================================

export function getAnnotationsByChapter(chapterId: string): Annotation[] {
  return (getAppData().annotations || [])
    .filter(a => a.chapterId === chapterId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function createAnnotation(chapterId: string, quote: string, note: string): Annotation {
  const data = getAppData();
  const ann: Annotation = { id: Date.now().toString(), chapterId, quote, note, createdAt: new Date().toISOString() };
  if (!data.annotations) data.annotations = [];
  data.annotations.push(ann);
  saveAppData(data);
  return ann;
}

export function updateAnnotation(id: string, note: string): void {
  const data = getAppData();
  const idx = (data.annotations || []).findIndex(a => a.id === id);
  if (idx !== -1) { data.annotations[idx].note = note; saveAppData(data); }
}

export function deleteAnnotation(id: string): void {
  const data = getAppData();
  data.annotations = (data.annotations || []).filter(a => a.id !== id);
  saveAppData(data);
}

// Technical Status helper
export function updateChapterTechnicalStatus(chapterId: string, technicalStatus: TechnicalStatus): void {
  const data = getAppData();
  const idx = data.chapters.findIndex(c => c.id === chapterId);
  if (idx !== -1) { data.chapters[idx].technicalStatus = technicalStatus; saveAppData(data); }
}


// ======================================
// Peer Review API
// ======================================

export function getPeerReviewsByChapter(chapterId: string): PeerReview[] {
  return (getAppData().peerReviews || []).filter(r => r.chapterId === chapterId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getAllPeerReviews(): PeerReview[] {
  return (getAppData().peerReviews || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function createPeerReview(chapterId: string, author: string, comment: string): PeerReview {
  const data = getAppData();
  const review: PeerReview = { id: Date.now().toString(), chapterId, author, comment, status: 'Open', createdAt: new Date().toISOString() };
  if (!data.peerReviews) data.peerReviews = [];
  data.peerReviews.push(review);
  saveAppData(data);
  return review;
}

export function updatePeerReview(id: string, updates: Partial<PeerReview>): void {
  const data = getAppData();
  const idx = (data.peerReviews || []).findIndex(r => r.id === id);
  if (idx !== -1) { data.peerReviews[idx] = { ...data.peerReviews[idx], ...updates }; saveAppData(data); }
}

export function deletePeerReview(id: string): void {
  const data = getAppData();
  data.peerReviews = (data.peerReviews || []).filter(r => r.id !== id);
  saveAppData(data);
}


// ======================================
// Calendar API
// ======================================

export function getAllCalendarItems(): CalendarItem[] {
  return (getAppData().calendarItems || []).sort((a, b) => a.deadline.localeCompare(b.deadline));
}

export function getCalendarItemByChapter(chapterId: string): CalendarItem | undefined {
  return (getAppData().calendarItems || []).find(i => i.chapterId === chapterId);
}

export function createCalendarItem(chapterId: string, deadline: string, note: string): CalendarItem {
  const data = getAppData();
  const item: CalendarItem = { id: Date.now().toString(), chapterId, deadline, note, createdAt: new Date().toISOString() };
  if (!data.calendarItems) data.calendarItems = [];
  // Remove existing item for same chapter
  data.calendarItems = data.calendarItems.filter(i => i.chapterId !== chapterId);
  data.calendarItems.push(item);
  saveAppData(data);
  return item;
}

export function deleteCalendarItem(chapterId: string): void {
  const data = getAppData();
  data.calendarItems = (data.calendarItems || []).filter(i => i.chapterId !== chapterId);
  saveAppData(data);
}


// ======================================
// Templates API
// ======================================

export function getAllCustomTemplates(): CustomTemplate[] {
  return (getAppData().customTemplates || []).sort((a, b) => a.name.localeCompare(b.name));
}

export function createCustomTemplate(template: Omit<CustomTemplate, 'id' | 'createdAt'>): CustomTemplate {
  const data = getAppData();
  const t: CustomTemplate = { ...template, id: Date.now().toString(), createdAt: new Date().toISOString() };
  if (!data.customTemplates) data.customTemplates = [];
  data.customTemplates.push(t);
  saveAppData(data);
  return t;
}

export function updateCustomTemplate(id: string, updates: Partial<CustomTemplate>): void {
  const data = getAppData();
  const idx = (data.customTemplates || []).findIndex(t => t.id === id);
  if (idx !== -1) { data.customTemplates[idx] = { ...data.customTemplates[idx], ...updates }; saveAppData(data); }
}

export function deleteCustomTemplate(id: string): void {
  const data = getAppData();
  data.customTemplates = (data.customTemplates || []).filter(t => t.id !== id);
  saveAppData(data);
}
