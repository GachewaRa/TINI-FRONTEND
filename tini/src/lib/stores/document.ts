// src/lib/stores/documents.ts
import { writable } from 'svelte/store';
import type { Document, DocumentHighlight } from '$lib/types/document';

export const documents = writable<Document[]>([]);
export const currentDocument = writable<Document | null>(null);
export const documentHighlights = writable<DocumentHighlight[]>([]);
export const selectedText = writable<string>('');
export const highlightMode = writable<boolean>(false);