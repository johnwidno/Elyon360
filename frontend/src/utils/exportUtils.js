import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Export data to PDF format
 * @param {string} fileName - Name of the file to be saved
 * @param {string[]} headers - Array of table headers
 * @param {any[][]} data - Array of data rows
 * @param {string} title - Title to be displayed in the PDF
 */
export const exportToPDF = (fileName, headers, data, title = 'Rapport') => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);

    // Add date
    const dateStr = `Généré le: ${new Date().toLocaleString()}`;
    doc.text(dateStr, 14, 30);

    // Use autoTable for the data
    doc.autoTable({
        head: [headers],
        body: data,
        startY: 35,
        theme: 'striped',
        headStyles: { fillColor: [45, 45, 138] }, // Matches #2D2D8A
        styles: { fontSize: 9, cellPadding: 3 },
    });

    doc.save(`${fileName}_${new Date().getTime()}.pdf`);
};

/**
 * Export data to Excel format
 * @param {string} fileName - Name of the file to be saved
 * @param {any[]} data - Array of objects to be exported
 */
export const exportToExcel = (fileName, data) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Données");

    // Generate buffer and force download
    XLSX.writeFile(workbook, `${fileName}_${new Date().getTime()}.xlsx`);
};
