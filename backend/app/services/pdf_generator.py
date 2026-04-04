import os
import datetime
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet

ARTIFACTS_DIR = Path("/app/app/ml/artifacts")
if not ARTIFACTS_DIR.exists():
    ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / "ml" / "artifacts"
PDFS_DIR = ARTIFACTS_DIR / "pdfs"
PDFS_DIR.mkdir(parents=True, exist_ok=True)

def generate_pdf_report(prediction_id: str, result) -> Path:
    pdf_path = PDFS_DIR / f"{prediction_id}.pdf"
    
    doc = SimpleDocTemplate(str(pdf_path), pagesize=letter)
    styles = getSampleStyleSheet()
    title_style = styles['Heading1']
    normal_style = styles['Normal']
    
    elements = []
    
    # Header
    elements.append(Paragraph(f"Diabetes Risk Prediction Report", title_style))
    elements.append(Spacer(1, 12))
    
    elements.append(Paragraph(f"Prediction ID: {prediction_id}", normal_style))
    elements.append(Paragraph(f"Date: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC", normal_style))
    elements.append(Spacer(1, 12))
    
    # Results
    prob = result.probability
    level = result.risk_level
    model_name = getattr(result, 'model_name', 'Ensemble')
    
    elements.append(Paragraph(f"<b>Overall Risk Level:</b> {level}", normal_style))
    elements.append(Paragraph(f"<b>Probability Score:</b> {prob:.1f}%", normal_style))
    elements.append(Paragraph(f"<b>Model Used:</b> {model_name}", normal_style))
    elements.append(Spacer(1, 20))
    
    # SHAP Data
    shap_factors = getattr(result, 'top_factors', [])
    if shap_factors:
        elements.append(Paragraph("<b>Key Contributing Factors:</b>", styles['Heading2']))
        elements.append(Spacer(1, 12))
        
        table_data = [["Feature", "Direction", "Impact Value"]]
        for f in shap_factors:
            try:
                table_data.append([
                    f.get("display_name", ""),
                    f.get("direction", ""),
                    f"{f.get('shap_value', 0):.4f}"
                ])
            except AttributeError:
                # If they are dicts or objects, handle safely
                pass
                
        t = Table(table_data, colWidths=[200, 100, 100])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#2e3440')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,0), 6),
            ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#d8dee9'))
        ]))
        elements.append(t)
        elements.append(Spacer(1, 24))
        
    elements.append(Paragraph("Disclaimer: This tool is for informational purposes only.", normal_style))
    
    doc.build(elements)
    return pdf_path
