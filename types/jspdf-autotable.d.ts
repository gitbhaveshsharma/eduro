declare module 'jspdf-autotable' {
    import { jsPDF } from 'jspdf';

    interface AutoTableOptions {
        startY?: number;
        head?: any[][];
        body?: any[][];
        styles?: any;
        headStyles?: any;
        columnStyles?: any;
        alternateRowStyles?: any;
        margin?: { left?: number; right?: number; top?: number; bottom?: number };
        theme?: 'striped' | 'grid' | 'plain';
    }

    function autoTable(doc: jsPDF, options: AutoTableOptions): void;

    export default autoTable;
}
