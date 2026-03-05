import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Export data to PDF format
 * @param {string} fileName - Name of the file to be saved
 * @param {string[]} headers - Array of table headers
 * @param {any[][]} data - Array of data rows
 * @param {string} title - Title/Legacy Title
 * @param {object} options - Optional parameters: headerLines (string[]), footerText (string)
 */
export const exportToPDF = (fileName, headers, data, title = 'Rapport', options = {}) => {
    const doc = new jsPDF();
    const { headerLines, footerText } = options;

    let currentY = 22;

    if (headerLines && Array.isArray(headerLines)) {
        doc.setFontSize(12);
        headerLines.forEach(line => {
            // Support both string and object formats
            const lineText = typeof line === 'string' ? line : line.text;
            const lineAlign = typeof line === 'object' ? (line.align || 'left') : 'left';
            const lineStyle = typeof line === 'object' ? (line.style || 'normal') : 'normal';

            doc.setFont('helvetica', lineStyle);

            // Calculate x position based on alignment
            const pageWidth = doc.internal.pageSize.getWidth();
            let xPos = 14; // default left
            if (lineAlign === 'center') {
                xPos = pageWidth / 2;
            } else if (lineAlign === 'right') {
                xPos = pageWidth - 14;
            }

            doc.text(lineText, xPos, currentY, { align: lineAlign });
            currentY += 7;
        });
    } else {
        // Fallback to legacy title
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(title, 14, currentY);
        currentY += 8;

        // Add date
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        const dateStr = `Généré le: ${new Date().toLocaleString()}`;
        doc.text(dateStr, 14, currentY);
        currentY += 5;
    }

    // Use autoTable for the data
    autoTable(doc, {
        head: [headers],
        body: data,
        startY: currentY + 5,
        theme: 'striped',
        headStyles: { fillColor: [45, 45, 138] }, // Matches #2D2D8A
        styles: { fontSize: 9, cellPadding: 3 },
    });

    if (footerText) {
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.setTextColor(150);
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            doc.text(footerText, pageWidth - 14, pageHeight - 10, { align: 'right' });
        }
    }

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
