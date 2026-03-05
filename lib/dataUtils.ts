import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');
const BOOKS_DIR = path.join(DATA_DIR, 'books');

export function getActiveBookId() {
  const activeBookPath = path.join(BOOKS_DIR, 'activeBook.json');
  if (fs.existsSync(activeBookPath)) {
    try {
      return JSON.parse(fs.readFileSync(activeBookPath, 'utf-8')).id || 'default';
    } catch {}
  }
  return 'default';
}

export function setActiveBookId(id: string) {
  ensureBooksDir();
  const activeBookPath = path.join(BOOKS_DIR, 'activeBook.json');
  fs.writeFileSync(activeBookPath, JSON.stringify({ id }), 'utf-8');
}

export function ensureBookDataDir(subDir: string) {
  const bookId = getActiveBookId();
  const dirPath = path.join(BOOKS_DIR, bookId, subDir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}

export function getAllFiles(subDir: string) {
  const dirPath = ensureBookDataDir(subDir);
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
  return files.map(file => {
    const content = fs.readFileSync(path.join(dirPath, file), 'utf-8');
    return JSON.parse(content);
  });
}

export function getFile(subDir: string, id: string) {
  const dirPath = ensureBookDataDir(subDir);
  const filePath = path.join(dirPath, `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

export function saveFile(subDir: string, id: string, data: unknown) {
  const dirPath = ensureBookDataDir(subDir);
  const filePath = path.join(dirPath, `${id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function deleteFile(subDir: string, id: string) {
  const dirPath = ensureBookDataDir(subDir);
  const filePath = path.join(dirPath, `${id}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}


// Global book management
export function ensureBooksDir() {
  if (!fs.existsSync(BOOKS_DIR)) {
    fs.mkdirSync(BOOKS_DIR, { recursive: true });
  }
}

export function getAllBooks() {
  ensureBooksDir();
  const bookSubDirs = fs.readdirSync(BOOKS_DIR).filter(f => fs.statSync(path.join(BOOKS_DIR, f)).isDirectory());
  
  const books = [];
  for (const dirName of bookSubDirs) {
    const metaPath = path.join(BOOKS_DIR, dirName, 'meta.json');
    if (fs.existsSync(metaPath)) {
      books.push(JSON.parse(fs.readFileSync(metaPath, 'utf-8')));
    } else {
      books.push({ id: dirName, title: `Book ${dirName}`, createdAt: new Date().toISOString() });
    }
  }
  // sort by newest
  return books.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function createBook(title: string) {
  ensureBooksDir();
  const id = Date.now().toString();
  const bookPath = path.join(BOOKS_DIR, id);
  fs.mkdirSync(bookPath, { recursive: true });
  
  const meta = { id, title, createdAt: new Date().toISOString() };
  fs.writeFileSync(path.join(bookPath, 'meta.json'), JSON.stringify(meta, null, 2), 'utf-8');
  return meta;
}

export function deleteBook(id: string) {
  const bookPath = path.join(BOOKS_DIR, id);
  if (fs.existsSync(bookPath)) {
    fs.rmSync(bookPath, { recursive: true, force: true });
    
    // If we deleted the active book, reset the active book tracking
    const activeId = getActiveBookId();
    if (activeId === id) {
      const activeBookPath = path.join(BOOKS_DIR, 'activeBook.json');
      if (fs.existsSync(activeBookPath)) {
        fs.unlinkSync(activeBookPath); // removes the active book tracking file
      }
    }
    
    return true;
  }
  return false;
}
