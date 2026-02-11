from fpdf import FPDF
import datetime
from typing import Dict, Any

class DMARCReportPDF(FPDF):
    def header(self):
        # Logo placeholder or icon
        self.set_font("helvetica", "B", 16)
        self.set_text_color(59, 130, 246) # Primary blue
        self.cell(0, 10, "DMARC Report Manager", ln=True, align="L")
        self.set_font("helvetica", "", 10)
        self.set_text_color(100)
        self.cell(0, 5, f"Generated on {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}", ln=True, align="L")
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font("helvetica", "I", 8)
        self.set_text_color(128)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")

def generate_summary_pdf(stats: Dict[str, Any], date_range: str) -> bytes:
    pdf = DMARCReportPDF()
    pdf.add_page()
    pdf.set_font("helvetica", "B", 20)
    pdf.set_text_color(31, 41, 55) # Dark gray
    pdf.cell(0, 15, "Summary Report", ln=True)
    
    pdf.set_font("helvetica", "", 12)
    pdf.cell(0, 10, f"Period: {date_range}", ln=True)
    pdf.ln(5)

    # Key Stats Section
    pdf.set_fill_color(249, 250, 251) # Light gray
    pdf.set_font("helvetica", "B", 14)
    pdf.cell(0, 10, " Key Infrastructure Statistics", ln=True, fill=True)
    pdf.ln(2)
    
    pdf.set_font("helvetica", "", 11)
    col_width = pdf.epw / 2
    pdf.cell(col_width, 10, f"Total Reports: {stats['total_reports']}")
    pdf.cell(col_width, 10, f"Total Email Volume: {stats['total_volume']}", ln=True)
    pdf.ln(5)

    # Disposition Breakdown
    pdf.set_font("helvetica", "B", 14)
    pdf.cell(0, 10, " Disposition Breakdown", ln=True, fill=True)
    pdf.ln(2)
    
    pdf.set_font("helvetica", "B", 11)
    pdf.cell(col_width, 10, "Policy Disposition")
    pdf.cell(col_width, 10, "Volume", ln=True)
    
    pdf.set_font("helvetica", "", 11)
    ds = stats.get('disposition_stats', {})
    for disp, count in ds.items():
        name = "Pass (none)" if disp == "none" else disp.capitalize()
        pdf.cell(col_width, 10, name)
        pdf.cell(col_width, 10, f"{count:,}", ln=True)
    pdf.ln(5)

    # Recent Activity
    if stats.get('recent_activity'):
        pdf.set_font("helvetica", "B", 14)
        pdf.cell(0, 10, " Recent Activity (Top 10)", ln=True, fill=True)
        pdf.ln(2)
        
        # Table Header
        pdf.set_font("helvetica", "B", 10)
        w = [pdf.epw * 0.4, pdf.epw * 0.3, pdf.epw * 0.15, pdf.epw * 0.15]
        pdf.cell(w[0], 10, "Organization / Domain", border=1)
        pdf.cell(w[1], 10, "Date", border=1)
        pdf.cell(w[2], 10, "Total", border=1)
        pdf.cell(w[3], 10, "Pass", border=1, ln=True)
        
        pdf.set_font("helvetica", "", 9)
        for item in stats['recent_activity']:
            org = f"{item['org_name']}\n{item['domain']}" if item.get('domain') else item['org_name']
            date_str = datetime.datetime.fromtimestamp(item['date_end']).strftime('%Y-%m-%d')
            
            # Multi-line cell handling
            x, y = pdf.get_x(), pdf.get_y()
            pdf.multi_cell(w[0], 5, org, border=1)
            h = pdf.get_y() - y
            pdf.set_xy(x + w[0], y)
            pdf.cell(w[1], h, date_str, border=1)
            pdf.cell(w[2], h, str(item['total_count']), border=1)
            pdf.cell(w[3], h, str(item['pass_count']), border=1, ln=True)
            
            if pdf.get_y() > 250: # Simple page break check
                pdf.add_page()

    return pdf.output()
