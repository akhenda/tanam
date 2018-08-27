import * as admin from "firebase-admin";
import * as url from 'url';

export type ContentState = 'published' | 'unpublished';
export type TemplateType = 'dust';

export interface DocumentMeta {
  id: string;           // The document's ID
  path: string;         // The fully qualified path to the document
  collection: string;   // Name of the document's collection
  createTime: Date;     // Time of creation
  updateTime: Date;     // Time updated
  readTime: Date;       // Time of read
}

interface ContentDocument {
  data: { [key: string]: any };   // Contains the document's contextual data (title, body, images, etc)
  path: string[];                 // Array of path sections. Index 0 always contain the full permalink
  publishTime: Date;              // Time of publishing the document/page (manually, unrestricted set by author)
  updateTime: Date;               // Automatic timestamp of the latest time the document was updated
  template: string;               // Name of the template to use (name of file in the theme)
  status: ContentState;           // Document's publish status
  tags: string[];                 // Optional document tags
}

/**
 * Page context class is the object that is passed into the template and can be accessed via the `page` attribute.
 */
export class PageContext {
  readonly meta: DocumentMeta;
  readonly data: { [key: string]: any };
  readonly path: string[];
  readonly publishTime: Date;
  readonly updateTime: Date;
  readonly template: string;
  readonly tags: string[];

  constructor(document: admin.firestore.DocumentSnapshot) {
    this.meta = {
      id: document.id,
      path: document.ref.path,
      collection: document.ref.parent.path,
      createTime: document.createTime.toDate(),
      updateTime: document.updateTime.toDate(),
      readTime: document.readTime.toDate()
    } as DocumentMeta;

    const contentDocument = document.data() as ContentDocument;
    this.data = contentDocument.data;
    this.path = contentDocument.path.slice();
    this.publishTime = contentDocument.publishTime;
    this.updateTime = contentDocument.updateTime;
    this.template = contentDocument.template;
    this.tags = (contentDocument.tags || []).slice();
  }
}

export async function getDocumentByPath(documentPath: string) {
  console.log(`[getDocumentByPath] Fetch document: ${documentPath}`);
  const doc = await admin.firestore().doc(documentPath).get();
  if (!doc) {
    console.log(`[getDocumentByPath] Document not found: ${documentPath}`);
    return null;
  }

  return new PageContext(doc);
}

export function getAllDocuments() {
  return getDocumentsByUrl();
}

export async function getDocumentsByUrl(requestUrl?: string) {
  const urlPath = !!requestUrl ? url.parse(requestUrl).pathname : '';
  console.log(!!requestUrl ? `Find document matching URL: ${requestUrl}` : 'Get ALL documents n ALL collections');

  const documents: admin.firestore.DocumentSnapshot[] = [];
  const collections = await admin.firestore().getCollections();
  console.log(`Found ${collections.length} collections: ${JSON.stringify(collections.map(coll => coll.path))}`);
  for (const collection of collections) {
    const query = !!urlPath ? collection.where('path', 'array-contains', urlPath) : collection;
    const snap = await query.get();

    console.log(`Found ${snap.docs.length} documents in collection '${collection.path}'.`);
    snap.docs.forEach(doc => {
      documents.push(doc);
    });
  }

  console.log(`Found ${documents.length} documents in total.`);

  return documents.filter(doc => (doc.data() as ContentDocument).status === 'published');
}

export async function getDocumentsInCollection(collection: string, orderBy = 'publishTime', sortOrder: FirebaseFirestore.OrderByDirection = 'desc', limit = 10) {
  const snap = await admin.firestore()
    .collection(collection)
    .where('status', '==', 'published')
    .orderBy(orderBy, sortOrder)
    .limit(limit)
    .get();

  console.log(`[dust documents] Fetched ${snap.docs.length} documents`);
  return snap.docs.map(doc => new PageContext(doc));
}

export async function getTemplateFiles(theme: string, templateType: TemplateType = 'dust') {
  console.log(`[getTemplateFiles] Get template files for theme '${theme}'`);

  const files = await getThemeFiles(theme);
  const dustFiles = files.filter(file => file.name.endsWith(`.${templateType}`));
  console.log(`[getTemplateFiles] Found ${dustFiles.length} ${templateType} templates.`);
  return dustFiles;
}

export async function getThemeFiles(theme: string) {
  console.log(`[getThemeFiles] Get template files for theme '${theme}'`);
  const queryOptions = {
    prefix: `themes/${theme}/`
  };

  const [files] = await admin.storage().bucket().getFiles(queryOptions);
  console.log(`[getThemeFiles] Found ${files.length} files in theme "${theme}".`);

  return files;
}