import sqlite3
import json
import os
from pathlib import Path

DB_PATH = os.environ.get('DB_PATH', 'dmarc_reports.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            report_id TEXT UNIQUE,
            org_name TEXT,
            date_begin INTEGER,
            date_end INTEGER,
            domain TEXT,
            policy_published TEXT, -- JSON blob
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            report_id INTEGER,
            source_ip TEXT,
            count INTEGER,
            disposition TEXT,
            dkim TEXT,
            spf TEXT,
            FOREIGN KEY(report_id) REFERENCES reports(id)
        )
    ''')
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT,
            last_name TEXT,
            email TEXT UNIQUE,
            phone TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    _seed_default_user(conn)
    conn.close()

def _seed_default_user(conn):
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM users")
    if c.fetchone()[0] == 0:
        c.execute('''
            INSERT INTO users (first_name, last_name, email, phone)
            VALUES (?, ?, ?, ?)
        ''', ("John", "Doe", "admin@example.com", "555-0199"))
        conn.commit()


def save_report(parsed_data):
    conn = get_db()
    c = conn.cursor()
    
    meta = parsed_data['metadata']
    policy = parsed_data['policy']
    
    # Check if report already exists
    c.execute("SELECT id FROM reports WHERE report_id = ?", (meta['report_id'],))
    existing = c.fetchone()
    if existing:
        conn.close()
        return existing['id'] # Already saved
    
    c.execute('''
        INSERT INTO reports (report_id, org_name, date_begin, date_end, domain, policy_published)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        meta['report_id'],
        meta['org_name'],
        meta['date_range_begin'],
        meta['date_range_end'],
        policy['domain'],
        json.dumps(policy)
    ))
    
    report_db_id = c.lastrowid
    
    for rec in parsed_data['records']:
        c.execute('''
            INSERT INTO records (report_id, source_ip, count, disposition, dkim, spf)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            report_db_id,
            rec['source_ip'],
            rec['count'],
            rec['disposition'],
            rec['dkim'],
            rec['spf']
        ))
        
    conn.commit()
    conn.close()
    return report_db_id

def get_stats(start_date=None, end_date=None):
    conn = get_db()
    c = conn.cursor()
    
    # Build Date Filter Clause
    date_clause = ""
    params = []
    
    if start_date and end_date:
        date_clause = "WHERE date_end BETWEEN ? AND ?"
        params = [start_date, end_date]
    elif start_date:
        date_clause = "WHERE date_end >= ?"
        params = [start_date]
    elif end_date:
        date_clause = "WHERE date_end <= ?"
        params = [end_date]
            
    # Total Reports
    c.execute(f"SELECT COUNT(*) FROM reports {date_clause}", params)
    total_reports = c.fetchone()[0]
    
    # Calculate volume and compliance
    # We need to join with reports to filter by date
    c.execute(f"""
        SELECT SUM(rec.count) 
        FROM records rec
        JOIN reports r ON rec.report_id = r.id
        {date_clause}
    """, params)
    total_volume = c.fetchone()[0] or 0
    
    c.execute(f"""
        SELECT COALESCE(rec.disposition, 'none') as disposition, SUM(rec.count) 
        FROM records rec
        JOIN reports r ON rec.report_id = r.id
        {date_clause}
        GROUP BY disposition
    """, params)
    disposition_stats = {row[0]: row[1] for row in c.fetchall()}
    
    # Recent activity - Apply date filter here too if desired, or keep as "most recent regardless of filter"
    # Typically "Recent Activity" respects the filter in dashboards.
    # Recent activity - Reports with stats
    c.execute(f"""
        SELECT 
            r.id, r.org_name, r.domain, r.created_at, r.date_end,
            SUM(rec.count) as total_count,
            SUM(CASE WHEN COALESCE(rec.disposition, 'none') = 'none' THEN rec.count ELSE 0 END) as pass_count,
            SUM(CASE WHEN COALESCE(rec.disposition, 'none') != 'none' THEN rec.count ELSE 0 END) as fail_count
        FROM reports r
        JOIN records rec ON r.id = rec.report_id
        {date_clause}
        GROUP BY r.id
        ORDER BY r.date_end DESC
        LIMIT 10
    """, params)
    recent = [dict(row) for row in c.fetchall()]
    
    # Time Series Data for Graph
    c.execute(f"""
        SELECT 
            DATE(r.date_end, 'unixepoch') as day,
            COALESCE(rec.disposition, 'none'),
            SUM(rec.count)
        FROM records rec
        JOIN reports r ON rec.report_id = r.id
        {date_clause}
        GROUP BY day, rec.disposition
        ORDER BY day ASC
    """, params)
    
    # Process into suitable format: [{"name": "YYYY-MM-DD", "pass": 123, "quarantine": 10, "reject": 5}, ...]
    rows = c.fetchall()
    daily_data = {}
    
    for row in rows:
        day = row[0]
        disposition = row[1]
        count = row[2]
        
        if day not in daily_data:
            daily_data[day] = {"name": day, "pass": 0, "quarantine": 0, "reject": 0}
        
        # Map disposition to graph keys
        if disposition == "none":
            daily_data[day]["pass"] += count
        elif disposition == "quarantine":
            daily_data[day]["quarantine"] += count
        elif disposition == "reject":
            daily_data[day]["reject"] += count
            
    volume_series = list(daily_data.values())

    conn.close()
    
    return {
        'total_reports': total_reports,
        'total_volume': total_volume,
        'disposition_stats': disposition_stats,
        'recent_activity': recent,
        'volume_series': volume_series
    }

def get_reports_list(page=1, page_size=50, search=None, domain=None):
    conn = get_db()
    c = conn.cursor()
    
    query = "SELECT r.id, r.report_id, r.org_name, r.domain, r.date_end, r.created_at FROM reports r"
    count_query = "SELECT COUNT(*) FROM reports r"

    conditions = []
    params = []
    
    if search:
        conditions.append("(r.org_name LIKE ? OR r.report_id LIKE ? OR r.domain LIKE ?)")
        params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])
        
    if domain:
        conditions.append("r.domain = ?")
        params.append(domain)

        
    if conditions:
        clause = " WHERE " + " AND ".join(conditions)
        query += clause
        count_query += clause
        
    # Get total count
    c.execute(count_query, params)
    total = c.fetchone()[0]
    
    # Get paginated data
    # Get paginated data with stats
    # We need to reconstruct the query to include aggregation
    full_query = f"""
        SELECT 
            r.id, r.report_id, r.org_name, r.domain, r.date_end, r.created_at,
            SUM(rec.count) as total_count,
            SUM(CASE WHEN COALESCE(rec.disposition, 'none') = 'none' THEN rec.count ELSE 0 END) as pass_count,
            SUM(CASE WHEN COALESCE(rec.disposition, 'none') != 'none' THEN rec.count ELSE 0 END) as fail_count
        FROM reports r
        JOIN records rec ON r.id = rec.report_id
    """
    
    if conditions:
        full_query += " WHERE " + " AND ".join(conditions)
        
    # Add pagination (limit and offset) to the query
    full_query += " GROUP BY r.id ORDER BY r.date_end DESC LIMIT ? OFFSET ?"
    # Append pagination parameters to the existing params list
    params.extend([page_size, (page - 1) * page_size])
    c.execute(full_query, params)
    rows = [dict(row) for row in c.fetchall()]
    
    conn.close()
    
    return {
        "items": rows,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size
    }

def get_report_detail(report_identifier):
    conn = get_db()
    c = conn.cursor()
    
    # Try numerical ID first
    report = None
    if str(report_identifier).isdigit():
        c.execute("SELECT * FROM reports WHERE id = ?", (int(report_identifier),))
        report = c.fetchone()
    
    # If not found or not numerical, try report_id string
    if not report:
        c.execute("SELECT * FROM reports WHERE report_id = ?", (str(report_identifier),))
        report = c.fetchone()
    
    if not report:
        conn.close()
        return None
        
    db_id = report['id']
    c.execute("SELECT * FROM records WHERE report_id = ?", (db_id,))
    records = [dict(row) for row in c.fetchall()]
    conn.close()
    
    res = dict(report)
    res['policy_published'] = json.loads(res['policy_published'])
    res['records'] = records
    return res



def delete_reports(start_date=None, end_date=None, domain=None, org_name=None, days=None):
    """Delete reports with optional filters.
    Parameters:
      start_date, end_date: Unix timestamps (seconds) or None.
      domain: filter by domain string.
      org_name: filter by organization name.
      days: integer for relative days back from now.
    Returns number of deleted rows.
    """
    conn = get_db()
    c = conn.cursor()
    clauses = []
    params = []
    if days is not None:
        now = int(datetime.datetime.utcnow().timestamp())
        start_ts = now - int(days) * 86400
        clauses.append('date_end >= ?')
        params.append(start_ts)
    if start_date is not None:
        clauses.append('date_end >= ?')
        params.append(start_date)
    if end_date is not None:
        clauses.append('date_end <= ?')
        params.append(end_date)
    if domain:
        clauses.append('domain = ?')
        params.append(domain)
    if org_name:
        clauses.append('org_name = ?')
        params.append(org_name)
    where_clause = ' AND '.join(clauses) if clauses else '1=1'
    sql = f'DELETE FROM reports WHERE {where_clause}'
    c.execute(sql, params)
    deleted = c.rowcount
    conn.commit()
    conn.close()
def get_domain_stats():
    """Returns aggregated stats (Pass/Quarantine/Reject) for each unique domain."""
    conn = get_db()
    c = conn.cursor()
    
    c.execute("""
        SELECT 
            r.domain,
            COUNT(DISTINCT r.id) as report_count,
            MAX(r.date_end) as last_seen,
            SUM(rec.count) as total_volume,
            SUM(CASE WHEN COALESCE(rec.disposition, 'none') = 'none' THEN rec.count ELSE 0 END) as pass_count,
            SUM(CASE WHEN COALESCE(rec.disposition, 'none') = 'quarantine' THEN rec.count ELSE 0 END) as quarantine_count,
            SUM(CASE WHEN COALESCE(rec.disposition, 'none') = 'reject' THEN rec.count ELSE 0 END) as reject_count
        FROM reports r
        JOIN records rec ON r.id = rec.report_id
        GROUP BY r.domain
        ORDER BY report_count DESC
    """)
    
    rows = [dict(row) for row in c.fetchall()]
    conn.close()
    return rows

def get_user_profile(user_id=1):
    """Fetch user profile details."""
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = c.fetchone()
    conn.close()
    return dict(user) if user else None

def update_user_profile(user_id, data):
    """Update user profile details."""
    conn = get_db()
    c = conn.cursor()
    c.execute('''
        UPDATE users 
        SET first_name = ?, last_name = ?, email = ?, phone = ?
        WHERE id = ?
    ''', (data['first_name'], data['last_name'], data['email'], data['phone'], user_id))
    conn.commit()
    conn.close()
    return True
