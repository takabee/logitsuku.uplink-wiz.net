# Copyright (c) 2025 uplink. All rights reserved.

import csv
import io
from collections import defaultdict
import datetime

def parse_csv(stream, month_col="年月", overtime_col="残業時間（h）"):
    """
    Parses the CSV stream and returns a tuple: (records, errors).
    errors is a list of strings describing skipped rows.
    """
    reader = csv.DictReader(stream)
    
    records = []
    errors = []
    
    row_num = 1 # Header is 1, so data starts at 2 usually, but DictReader iterates data. Let's count from 2.
    
    for row in reader:
        row_num += 1
        # Normalize keys
        row = {k.strip(): v for k, v in row.items()}
        
        if month_col not in row or overtime_col not in row:
            errors.append(f"行{row_num}: 必要な列が見つかりません。")
            continue 
            
        try:
            val = float(row[overtime_col])
        except ValueError:
            errors.append(f"行{row_num}: 残業時間が数値ではありません ({row.get(overtime_col, '')})")
            continue
            
        emp_id = row.get("従業員ID", "").strip()
        emp_name = row.get("氏名", "").strip()
        
        # Fallback: if no ID, use name as ID
        if not emp_id and emp_name:
            emp_id = emp_name

        records.append({
            "id": emp_id,
            "name": emp_name,
            "year_month": row[month_col],
            "overtime": val
        })
    return records, errors

def get_fiscal_year(year, month):
    """
    Returns the fiscal year for a given calendar year and month.
    Fiscal Year starts April 1st.
    """
    if month >= 4:
        return year
    else:
        return year - 1

def generate_fy_months(fy):
    """
    Generates a list of (year, month) tuples for a fiscal year (Apr to Mar).
    """
    months = []
    for m in range(4, 13):
        months.append((fy, m))
    for m in range(1, 4):
        months.append((fy + 1, m))
    return months

def format_ym(y, m):
    return f"{y}/{m:02d}"

def check_violations(records):
    """
    Checks for violations based on Japanese Labor Standards Act.
    Includes logic to fill missing months with 0 hours.
    """
    # Group data first
    # Map: emp_id -> { "name": name, "fiscal_years": { fy: { "year_month_str": hours } } }
    grouped = defaultdict(lambda: {"name": "", "fiscal_years": defaultdict(dict)})
    
    for r in records:
        emp_id = r["id"]
        grouped[emp_id]["name"] = r["name"]
        
        ym_str = r["year_month"]
        try:
            # Handle various date formats if possible, but strict YYYY/MM expected based on plan
            parts = ym_str.split("/")
            if len(parts) != 2:
                # Try handling YYYY-MM
                parts = ym_str.split("-")
                
            y_str, m_str = parts[0], parts[1]
            year = int(y_str)
            month = int(m_str)
        except (ValueError, IndexError):
            continue 
            
        fy = get_fiscal_year(year, month)
        grouped[emp_id]["fiscal_years"][fy][ym_str] = r["overtime"]

    results = []
    
    for emp_id, emp_data in grouped.items():
        name = emp_data["name"]
        fys = emp_data["fiscal_years"]
        
        for fy, known_months_data in fys.items():
            # "Gap Filling": Iterate all months in FY. If missing, treat as 0.
            # However, we must ensure we use the explicit string format expected.
            # The 'known_months_data' keys are the original strings from CSV (e.g., '2024/04').
            # We need to normalize or map carefully.
            # To be robust, let's regenerate the standard keys and check.
            
            fy_months_tuples = generate_fy_months(fy)
            
            total_overtime = 0.0
            over_45_count = 0
            violations = set()
            
            # Helper to map standard (y,m) to the value in known_months_data
            # We assume Input corresponds to standard 'YYYY/MM' or check looser match?
            # For simplicity & robustness: we reconstruct the likely key.
            # If the CSV had '2024/4', we might miss it if we check '2024/04'.
            # So let's rely on parsed integers from earlier.
            
            # Let's create a lookup using (y,m) tuple
            lookup = {}
            for k_str, valid_hours in known_months_data.items():
                 # Parse again (wasteful but safe) or store better structure earlier.
                 # Let's improve the earlier group structure.
                 try:
                    p = k_str.replace("-", "/").split("/")
                    y, m = int(p[0]), int(p[1])
                    lookup[(y, m)] = valid_hours
                    # Logic C Check (Raw data check)
                    if valid_hours > 100:
                        violations.add(f"単月100h超過 ({k_str}: {valid_hours}h)")
                 except:
                     pass
            
            # Sort keys to iterate chronologically
            sorted_months = sorted(lookup.keys()) 
            
            # --- Multi-month Average Logic (2-6 months) ---
            # We need to look at windows ending at each month in this fiscal year.
            # Note: Technically, "average" checks might cross fiscal years (e.g., March + April).
            # However, our grouped structure is by FY. To be strictly accurate, we should really 
            # flatten the entire history for the employee, sort by date, and run sliding windows.
            # But the current architecture splits by FY.
            # *Correction*: We can reconstruct the continuous timeline if we access 'grouped[emp_id]' directly 
            # or pass the full record set. But let's stay within the current loop structure if possible,
            # or adapt it.
            # BETTER APPROACH:
            # Let's collect ALL (year, month) data for the employee across all FYs first, 
            # then run the check. But 'check_violations' loop iterates by FY.
            # Let's add a helper to calculate averages given the full history.
            
            # To fix the "FY boundary issue" (March->April), we should ideally look at the previous FY's data.
            # Since 'grouped' has all FYs, we can access them.
            
            # Let's build a flat list of (year, month, hours) for this employee
            all_emp_months = []
            for f_y, f_data in fys.items():
                for date_str, h in f_data.items():
                     # Parse date_str again or be smarter.
                     # Re-using the parsing logic from above would be better refactored, but let's be pragmatic.
                     try:
                        p = date_str.replace("-", "/").split("/")
                        y_val, m_val = int(p[0]), int(p[1])
                        all_emp_months.append( (y_val, m_val, h, date_str) )
                     except:
                        pass
            
            all_emp_months.sort() # Sort by year, then month
            
            # Convert to a map for easy lookup by (y,m)
            full_history_map = { (x[0], x[1]): x[2] for x in all_emp_months }
            
            for y, m in fy_months_tuples:
                hours = lookup.get((y, m), 0.0)
                total_overtime += hours
                
                # Logic B: >45h count
                if hours > 45:
                    over_45_count += 1
                    
                # Logic D: 2-6 Month Averages
                # We need to check averages ending at THIS month (y,m).
                # Range 2 to 6
                current_dt = datetime.date(y, m, 1)
                
                for window_size in range(2, 7): # 2,3,4,5,6
                    avg_sum = 0
                    valid_window = True
                    debug_months = []
                    
                    for w in range(window_size):
                        # Subtract months
                        # Simple way: go back month by month
                        # (y, m) - w months
                        # Use a helper or simple logic
                        
                        target_y = y
                        target_m = m - w
                        while target_m < 1:
                            target_m += 12
                            target_y -= 1
                        
                        # Lookup
                        val = full_history_map.get((target_y, target_m), 0.0)
                        
                        # If we treat missing data as 0, this is fine.
                        # But strictly strict compliance might require knowing if data is truly "0" or "missing".
                        # Here we assume 0 for missing.
                        
                        avg_sum += val
                        debug_months.append(f"{target_y}/{target_m:02d}")
                    
                    average = avg_sum / window_size
                    if average > 80:
                        # Violation found
                        # Flag it for the current FY if this month belongs to it
                        # (It does, we are iterating fy_months_tuples)
                        violations.add(f"複数月平均80h超過 ({window_size}ヶ月平均: {round(average, 1)}h - {format_ym(y,m)}時点)")

            # Logic A: Annual > 720h
            if total_overtime > 720:
                violations.add(f"年間上限超過 ({round(total_overtime, 1)}h)")
            
            # Logic B: >45h more than 6 times
            if over_45_count > 6:
                violations.add(f"45h超え回数違反 ({over_45_count}回)")
                
            results.append({
                "id": emp_id,
                "name": name,
                "fiscal_year": fy,
                "total_overtime": round(total_overtime, 2),
                "over_45_count": over_45_count,
                "violations": sorted(list(violations))
            })
            
    # Sort by ID and Fiscal Year
    results.sort(key=lambda x: (x["id"], x["fiscal_year"]))
    return results
