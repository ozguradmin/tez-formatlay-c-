export enum ContentType {
  TITLE = 'TITLE',
  HEADING = 'HEADING',
  PARAGRAPH = 'PARAGRAPH',
  LIST_ITEM = 'LIST_ITEM',
  BLOCK_QUOTE = 'BLOCK_QUOTE',
  TABLE = 'TABLE'
}

export interface FormattedBlock {
  id: string;
  type: ContentType;
  content: string;
  tableRows?: string[][]; // Optional property to store table data (array of rows, where each row is array of cells)
}

export interface FormatOptions {
  fontFamily: string;
  fontSize: number;
  lineSpacing: number; 
  margins: number; 
}