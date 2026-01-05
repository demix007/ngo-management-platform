#!/usr/bin/env python3
"""
Script to convert meal plan from text to a tabularized PDF
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import re

def parse_meal_plan(file_path):
    """Parse the meal plan text file into structured data"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    meal_plan = {}
    current_day = None
    
    lines = content.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Check if it's a day
        if line in days:
            current_day = line
            meal_plan[current_day] = {
                'Breakfast': '',
                'Mid-Morning Snack': '',
                'Lunch': '',
                'Afternoon Snack': '',
                'Dinner': '',
                'Evening': ''
            }
        elif current_day:
            # Check for meal types
            if line.startswith('Breakfast:'):
                meal_plan[current_day]['Breakfast'] = line.replace('Breakfast:', '').strip()
            elif line.startswith('Mid-Morning Snack:'):
                meal_plan[current_day]['Mid-Morning Snack'] = line.replace('Mid-Morning Snack:', '').strip()
            elif line.startswith('Lunch:'):
                meal_plan[current_day]['Lunch'] = line.replace('Lunch:', '').strip()
            elif line.startswith('Afternoon Snack:'):
                meal_plan[current_day]['Afternoon Snack'] = line.replace('Afternoon Snack:', '').strip()
            elif line.startswith('Dinner:'):
                meal_plan[current_day]['Dinner'] = line.replace('Dinner:', '').strip()
            elif line.startswith('Evening') or line.startswith('Evening (if needed):'):
                meal_plan[current_day]['Evening'] = re.sub(r'^Evening.*?:', '', line).strip()
    
    return meal_plan

def create_pdf(meal_plan, output_path):
    """Create a PDF with the meal plan in table format"""
    doc = SimpleDocTemplate(output_path, pagesize=letter,
                           rightMargin=0.5*inch, leftMargin=0.5*inch,
                           topMargin=0.5*inch, bottomMargin=0.5*inch)
    
    # Container for the 'Flowable' objects
    elements = []
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=getSampleStyleSheet()['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=20,
        alignment=1  # Center alignment
    )
    title = Paragraph("7-DAY MEAL PLAN WITH FRUITS", title_style)
    elements.append(title)
    elements.append(Spacer(1, 0.2*inch))
    
    # Prepare table data
    table_data = []
    
    # Header row
    header = ['Day', 'Breakfast', 'Mid-Morning<br/>Snack', 'Lunch', 
              'Afternoon<br/>Snack', 'Dinner', 'Evening']
    table_data.append(header)
    
    # Data rows
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    for day in days:
        if day in meal_plan:
            row = [
                day,
                meal_plan[day]['Breakfast'],
                meal_plan[day]['Mid-Morning Snack'],
                meal_plan[day]['Lunch'],
                meal_plan[day]['Afternoon Snack'],
                meal_plan[day]['Dinner'],
                meal_plan[day]['Evening']
            ]
            table_data.append(row)
    
    # Create table
    # Calculate column widths - Day column narrower, others distribute remaining space
    col_widths = [0.8*inch] + [1.4*inch] * 6
    
    # Create table with Paragraph objects for text wrapping
    table_data_formatted = []
    for row_idx, row in enumerate(table_data):
        formatted_row = []
        for col_idx, cell in enumerate(row):
            if row_idx == 0:  # Header row
                style = ParagraphStyle(
                    'HeaderStyle',
                    parent=getSampleStyleSheet()['Normal'],
                    fontSize=9,
                    fontName='Helvetica-Bold',
                    textColor=colors.white,
                    alignment=1  # Center
                )
            else:
                style = ParagraphStyle(
                    'CellStyle',
                    parent=getSampleStyleSheet()['Normal'],
                    fontSize=7,
                    leading=8,
                    alignment=0  # Left
                )
            formatted_row.append(Paragraph(str(cell), style))
        table_data_formatted.append(formatted_row)
    
    table = Table(table_data_formatted, colWidths=col_widths, repeatRows=1)
    
    # Apply table style
    table.setStyle(TableStyle([
        # Header row
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c3e50')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        
        # Alternating row colors
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f9fa')]),
        
        # Grid
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('LINEBELOW', (0, 0), (-1, 0), 2, colors.HexColor('#2c3e50')),
        
        # Cell padding
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    
    elements.append(table)
    
    # Build PDF
    doc.build(elements)

if __name__ == '__main__':
    input_file = 'meal_plan.html'
    output_file = 'meal_plan.pdf'
    
    print(f"Parsing meal plan from {input_file}...")
    meal_plan = parse_meal_plan(input_file)
    
    print(f"Generating PDF: {output_file}...")
    create_pdf(meal_plan, output_file)
    
    print(f"✓ PDF created successfully: {output_file}")



