from fpdf import FPDF
import datetime
from typing import Dict, Any, List
import matplotlib.pyplot as plt
import io
import matplotlib
matplotlib.use('Agg') # Headless backend

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

def _create_pie_chart(disposition_stats: Dict[str, int]) -> io.BytesIO:
    labels = []
    sizes = []
    colors = []
    
    # Map raw keys to friendly names and colors
    mapping = {
        'none': ('Pass', '#22c55e'),
        'quarantine': ('Quarantine', '#f59e0b'),
        'reject': ('Reject', '#ef4444')
    }
    
    for key, (label, color) in mapping.items():
        val = disposition_stats.get(key, 0)
        if val > 0:
            labels.append(label)
            sizes.append(val)
            colors.append(color)
            
    if not sizes:
        return None
        
    fig, ax = plt.subplots(figsize=(4, 3))
    ax.pie(sizes, labels=labels, autopct='%1.1f%%', startangle=90, colors=colors, textprops={'fontsize': 8})
    ax.axis('equal')
    plt.title('Disposition Distribution', fontsize=10)
    
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight', dpi=100)
    plt.close(fig)
    buf.seek(0)
    return buf

def _create_volume_chart(volume_series: List[Dict[str, Any]]) -> io.BytesIO:
    if not volume_series:
        return None
        
    dates = [d['name'] for d in volume_series]
    pass_v = [d.get('pass', 0) for d in volume_series]
    fail_v = [d.get('quarantine', 0) + d.get('reject', 0) for d in volume_series]
    
    fig, ax = plt.subplots(figsize=(7, 3))
    ax.plot(dates, pass_v, label='Pass', color='#22c55e', linewidth=2)
    ax.plot(dates, fail_v, label='Fail', color='#ef4444', linewidth=2)
    
    ax.fill_between(dates, pass_v, color='#22c55e', alpha=0.1)
    ax.fill_between(dates, fail_v, color='#ef4444', alpha=0.1)
    
    plt.xticks(rotation=45, fontsize=7)
    plt.yticks(fontsize=8)
    plt.legend(fontsize=8)
    plt.title('Email Volume Over Time', fontsize=10)
    plt.grid(True, linestyle='--', alpha=0.3)
    
    # Simple x-axis thinning
    if len(dates) > 10:
        for i, label in enumerate(ax.xaxis.get_ticklabels()):
            if i % (len(dates) // 7) != 0:
                label.set_visible(False)
                
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight', dpi=100)
    plt.close(fig)
    buf.seek(0)
    return buf

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
    pdf.cell(col_width, 10, f"Total Reports: {stats['total_reports']:,}")
    pdf.cell(col_width, 10, f"Total Email Volume: {stats['total_volume']:,}", ln=True)
    pdf.ln(5)

    # Charts Section
    y_before_charts = pdf.get_y()
    
    # Pie Chart
    pie_buf = _create_pie_chart(stats.get('disposition_stats', {}))
    if pie_buf:
        pdf.image(pie_buf, x=10, y=y_before_charts, w=80)
        
    # Stats table next to Pie Chart
    pdf.set_xy(100, y_before_charts + 10)
    pdf.set_font("helvetica", "B", 11)
    pdf.cell(50, 10, "Disposition Stats")
    pdf.ln(8)
    pdf.set_x(100)
    pdf.set_font("helvetica", "", 10)
    
    ds = stats.get('disposition_stats', {})
    for disp in ['none', 'quarantine', 'reject']:
        count = ds.get(disp, 0)
        name = "Pass (none)" if disp == "none" else disp.capitalize()
        pdf.cell(30, 8, name)
        pdf.cell(20, 8, f"{count:,}", ln=True)
        pdf.set_x(100)
    
    pdf.set_y(y_before_charts + 70) # Move below pie chart
    
    # Volume Chart
    vol_buf = _create_volume_chart(stats.get('volume_series', []))
    if vol_buf:
        pdf.ln(5)
        pdf.image(vol_buf, x=10, w=pdf.epw)
        pdf.ln(60)

    # Recent Activity
    if stats.get('recent_activity'):
        if pdf.get_y() > 200:
            pdf.add_page()
            
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
            curr_y = pdf.get_y()
            if curr_y > 260:
                pdf.add_page()
                curr_y = pdf.get_y()
                
            x, y = pdf.get_x(), pdf.get_y()
            pdf.multi_cell(w[0], 5, org, border=1)
            h = pdf.get_y() - y
            pdf.set_xy(x + w[0], y)
            pdf.cell(w[1], h, date_str, border=1)
            pdf.cell(w[2], h, str(item['total_count']), border=1)
            pdf.cell(w[3], h, str(item['pass_count']), border=1, ln=True)

    return pdf.output()
