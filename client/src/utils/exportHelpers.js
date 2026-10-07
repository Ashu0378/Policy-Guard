import jsPDF from 'jspdf';

export const exportToJSON = (scanData) => {
  if (!scanData) return;
  
  const dataStr = JSON.stringify(scanData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Security_Report_${scanData.domain || 'scan'}_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToPDF = (scanData) => {
  if (!scanData) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Title & Header
  doc.setFontSize(22);
  doc.setTextColor(34, 197, 94); // emerald-500
  doc.text('PolicyGuard Security Report', 14, 20);
  
  doc.setFontSize(14);
  doc.setTextColor(50, 50, 50);
  doc.text(`Domain: ${scanData.domain}`, 14, 30);
  doc.text(`Grade: ${scanData.grade} | Score: ${scanData.score}/100`, 14, 38);
  doc.text(`Date: ${new Date(scanData.scannedAt || Date.now()).toLocaleString()}`, 14, 46);

  // AI Executive Summary
  if (scanData.aiEnrichment && scanData.aiEnrichment.executiveSummary) {
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('AI Executive Summary', 14, 60);
    
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    const summaryLines = doc.splitTextToSize(scanData.aiEnrichment.executiveSummary, pageWidth - 28);
    doc.text(summaryLines, 14, 68);
  }

  // Header Results Breakdown
  let yPos = scanData.aiEnrichment ? 95 : 60;
  
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Security Headers Breakdown', 14, yPos);
  
  yPos += 10;
  doc.setFontSize(11);
  
  if (scanData.headerResults) {
    scanData.headerResults.forEach((header) => {
      // Prevent page overflow
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      const statusColor = header.status === 'PASS' ? [34, 197, 94] : 
                          header.status === 'WARN' ? [245, 158, 11] : [239, 68, 68];
                          
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.text(`[${header.status}]`, 14, yPos);
      
      doc.setTextColor(0, 0, 0);
      doc.text(`${header.name}: ${header.points}/${header.maxPoints} pts`, 35, yPos);
      
      yPos += 6;
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(9);
      const riskLines = doc.splitTextToSize(header.risk, pageWidth - 35);
      doc.text(riskLines, 35, yPos);
      
      yPos += (riskLines.length * 5) + 4;
      doc.setFontSize(11);
    });
  }

  doc.save(`Security_Report_${scanData.domain || 'scan'}.pdf`);
};
