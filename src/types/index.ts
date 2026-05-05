export type SectionType = 'front-matter' | 'part' | 'chapter' | 'back-matter';
export type PageType = 'standard' | 'title-page' | 'copyright' | 'dedication' | 'toc' | 'about-author';

export interface Section {
  id: string;
  type: SectionType;
  pageType?: PageType;
  title: string;
  content: string;
  meta?: Record<string, string>;
}

export type PaperType = 'cream' | 'white';
export type TrimSize = '5x8' | '6x9';
export type ThemeType = 'classic-fiction' | 'non-fiction' | 'workbook' | 'sci-fi' | 'romance' | 'fantasy';

export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  isbn?: string;
  paperType: PaperType;
  trimSize: TrimSize;
  theme: ThemeType;
  sections: Section[];
  coverImage?: string;
  backCoverImage?: string;
  backCoverText?: string;
  hideTextOnCover?: boolean;
}
