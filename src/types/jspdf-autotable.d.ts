declare module 'jspdf-autotable' {
  interface AutoTableOptions {
    startY?: number;
    head?: any[][];
    body?: any[][];
    theme?: 'striped' | 'grid' | 'plain';
    headStyles?: any;
    bodyStyles?: any;
    alternateRowStyles?: any;
    columnStyles?: any;
    margin?: { left?: number; right?: number; top?: number; bottom?: number };
    [key: string]: any;
  }

  interface jsPDFWithAutoTable {
    autoTable: (options: AutoTableOptions) => void;
  }
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: import('jspdf-autotable').AutoTableOptions) => jsPDF;
  }
}
