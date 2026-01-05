import fs from 'fs';
import PDFDocument from 'pdfkit';

function parseMealPlan(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    // Handle both \n and \r\n line endings
    const lines = content.split(/\r?\n/);
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const mealPlan = {};
    let currentDay = null;
    
    // Initialize all days
    days.forEach(day => {
        mealPlan[day] = {
            'Breakfast': '',
            'Mid-Morning Snack': '',
            'Lunch': '',
            'Afternoon Snack': '',
            'Dinner': '',
            'Evening': ''
        };
    });
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        if (!trimmed) continue;
        
        // Skip the title line
        if (trimmed.toUpperCase().includes('SAMPLE') || trimmed.toUpperCase().includes('MEAL PLAN')) {
            continue;
        }
        
        // Check if it's a day name (exact match)
        if (days.includes(trimmed)) {
            currentDay = trimmed;
            continue;
        }
        
        // Process meal entries
        if (currentDay && mealPlan[currentDay]) {
            if (trimmed.startsWith('Breakfast:')) {
                mealPlan[currentDay]['Breakfast'] = trimmed.replace(/^Breakfast:\s*/, '').trim();
            } else if (trimmed.startsWith('Mid-Morning Snack:')) {
                mealPlan[currentDay]['Mid-Morning Snack'] = trimmed.replace(/^Mid-Morning Snack:\s*/, '').trim();
            } else if (trimmed.startsWith('Lunch:')) {
                mealPlan[currentDay]['Lunch'] = trimmed.replace(/^Lunch:\s*/, '').trim();
            } else if (trimmed.startsWith('Afternoon Snack:')) {
                mealPlan[currentDay]['Afternoon Snack'] = trimmed.replace(/^Afternoon Snack:\s*/, '').trim();
            } else if (trimmed.startsWith('Dinner:')) {
                mealPlan[currentDay]['Dinner'] = trimmed.replace(/^Dinner:\s*/, '').trim();
            } else if (trimmed.startsWith('Evening')) {
                // Handle both "Evening:" and "Evening (if needed):"
                mealPlan[currentDay]['Evening'] = trimmed.replace(/^Evening\s*\([^)]*\)?\s*:\s*/, '').trim();
            }
        }
    }
    
    // Debug: Log parsed data
    console.log('Parsed meal plan sample:');
    console.log('Monday Breakfast:', mealPlan['Monday']['Breakfast'] || '(empty)');
    console.log('Monday Lunch:', mealPlan['Monday']['Lunch'] || '(empty)');
    
    return mealPlan;
}

function wrapText(text, maxWidth, doc, fontSize) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const width = doc.widthOfString(testLine, { fontSize });
        
        if (width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    
    if (currentLine) {
        lines.push(currentLine);
    }
    
    return lines.length > 0 ? lines : [''];
}

function getMaxLines(rowData, colWidths, doc, fontSize) {
    let maxLines = 1;
    
    rowData.forEach((cell, idx) => {
        const wrapped = wrapText(cell || '', colWidths[idx] - 6, doc, fontSize);
        maxLines = Math.max(maxLines, wrapped.length);
    });
    
    return maxLines;
}

function createPDF(mealPlan, outputPath) {
    const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 40, bottom: 40, left: 30, right: 30 }
    });
    
    doc.pipe(fs.createWriteStream(outputPath));
    
    // Title
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#1a1a1a')
       .text('7-DAY MEAL PLAN WITH FRUITS', {
           align: 'center'
       });
    
    // Table setup
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const columns = ['Day', 'Breakfast', 'Mid-Morning Snack', 'Lunch', 'Afternoon Snack', 'Dinner', 'Evening'];
    
    // Calculate column widths - optimized for single page
    const pageWidth = 612; // Letter size width in points
    const margins = 60; // Left + right margins
    const availableWidth = pageWidth - margins;
    const colWidths = [
        60,  // Day
        95,  // Breakfast
        80,  // Mid-Morning Snack
        95,  // Lunch
        80,  // Afternoon Snack
        95,  // Dinner
        55   // Evening
    ];
    
    const startX = 30;
    let startY = 70;
    const baseRowHeight = 20;
    const headerHeight = 30;
    const lineHeight = 8;
    const cellPadding = 3;
    const fontSize = 6.5;
    
    // Draw header
    doc.fontSize(8)
       .font('Helvetica-Bold')
       .fillColor('#FFFFFF');
    
    let currentX = startX;
    columns.forEach((col, idx) => {
        doc.rect(currentX, startY, colWidths[idx], headerHeight)
           .fill('#2c3e50');
        
        // Split long column names
        let colName = col;
        if (col === 'Mid-Morning Snack') {
            colName = 'Mid-\nMorning\nSnack';
        } else if (col === 'Afternoon Snack') {
            colName = 'After-\nnoon\nSnack';
        }
        const lines = colName.split('\n');
        
        let textY = startY + (headerHeight - (lines.length * 8)) / 2;
        lines.forEach((line, lineIdx) => {
            doc.fillColor('#FFFFFF')
               .text(line, currentX + cellPadding, textY + (lineIdx * 8), {
                   width: colWidths[idx] - (cellPadding * 2),
                   align: 'center'
               });
        });
        
        currentX += colWidths[idx];
    });
    
    startY += headerHeight;
    
    // Draw data rows
    doc.fontSize(fontSize)
       .font('Helvetica');
    
    days.forEach((day, rowIdx) => {
        const isEven = rowIdx % 2 === 0;
        const bgColor = isEven ? '#FFFFFF' : '#f8f9fa';
        
        const rowData = [
            day,
            mealPlan[day]['Breakfast'],
            mealPlan[day]['Mid-Morning Snack'],
            mealPlan[day]['Lunch'],
            mealPlan[day]['Afternoon Snack'],
            mealPlan[day]['Dinner'],
            mealPlan[day]['Evening']
        ];
        
        // Calculate row height based on content
        const maxLines = getMaxLines(rowData, colWidths, doc, fontSize);
        const rowHeight = Math.max(baseRowHeight, (maxLines * lineHeight) + (cellPadding * 2));
        
        // Ensure we don't go past page height
        const pageHeight = 792; // Letter size height
        if (startY + rowHeight > pageHeight - 40) {
            // Adjust row height to fit
            const remainingSpace = pageHeight - startY - 40;
            const adjustedRowHeight = Math.min(rowHeight, remainingSpace);
            const adjustedMaxLines = Math.floor((adjustedRowHeight - (cellPadding * 2)) / lineHeight);
            
            // Draw row background
            doc.rect(startX, startY, availableWidth, adjustedRowHeight)
               .fill(bgColor);
            
            // Draw borders
            doc.strokeColor('#CCCCCC')
               .lineWidth(0.5)
               .rect(startX, startY, availableWidth, adjustedRowHeight)
               .stroke();
            
            // Draw cell borders
            currentX = startX;
            colWidths.forEach((width, idx) => {
                if (idx < colWidths.length - 1) {
                    doc.moveTo(currentX + width, startY)
                       .lineTo(currentX + width, startY + adjustedRowHeight)
                       .stroke();
                }
                currentX += width;
            });
            
            // Draw cell content with truncation
            currentX = startX;
            rowData.forEach((cell, idx) => {
                const wrapped = wrapText(cell || '', colWidths[idx] - (cellPadding * 2), doc, fontSize);
                const displayLines = wrapped.slice(0, adjustedMaxLines);
                
                displayLines.forEach((line, lineIdx) => {
                    doc.fillColor('#000000')
                       .text(line, currentX + cellPadding, startY + cellPadding + (lineIdx * lineHeight), {
                           width: colWidths[idx] - (cellPadding * 2),
                           align: 'left'
                       });
                });
                
                currentX += colWidths[idx];
            });
            
            startY += adjustedRowHeight;
        } else {
            // Draw row background
            doc.rect(startX, startY, availableWidth, rowHeight)
               .fill(bgColor);
            
            // Draw borders
            doc.strokeColor('#CCCCCC')
               .lineWidth(0.5)
               .rect(startX, startY, availableWidth, rowHeight)
               .stroke();
            
            // Draw cell borders
            currentX = startX;
            colWidths.forEach((width, idx) => {
                if (idx < colWidths.length - 1) {
                    doc.moveTo(currentX + width, startY)
                       .lineTo(currentX + width, startY + rowHeight)
                       .stroke();
                }
                currentX += width;
            });
            
            // Draw cell content
            currentX = startX;
            rowData.forEach((cell, idx) => {
                const wrapped = wrapText(cell || '', colWidths[idx] - (cellPadding * 2), doc, fontSize);
                
                wrapped.forEach((line, lineIdx) => {
                    if (lineIdx * lineHeight < rowHeight - (cellPadding * 2)) {
                        doc.fillColor('#000000')
                           .text(line, currentX + cellPadding, startY + cellPadding + (lineIdx * lineHeight), {
                               width: colWidths[idx] - (cellPadding * 2),
                               align: 'left'
                           });
                    }
                });
                
                currentX += colWidths[idx];
            });
            
            startY += rowHeight;
        }
    });
    
    doc.end();
}

// Main execution
const inputFile = 'meal_plan.html';
const outputFile = 'meal_plan.pdf';

console.log(`Parsing meal plan from ${inputFile}...`);
const mealPlan = parseMealPlan(inputFile);

console.log(`Generating PDF: ${outputFile}...`);
createPDF(mealPlan, outputFile);

console.log(`✓ PDF created successfully: ${outputFile}`);

