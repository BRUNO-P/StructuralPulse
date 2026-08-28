import csv
import json

def clean_val(v):
    if not v:
        return None
    v = v.strip().replace('"', '').replace(',', '.').replace('D = ', '').replace('b = ', '').replace('h = ', '')
    try:
        return round(float(v), 4)
    except:
        return None

def clean_str(v):
    if not v:
        return ""
    return v.strip().replace('"', '')

database = {}

with open('PROFILES.csv', 'r', encoding='latin1') as f:
    reader = list(csv.reader(f))

def parse_rows(start_idx, end_idx, name_prefixes):
    items = []
    for i in range(start_idx, end_idx + 1):
        row = reader[i]
        if not row or not row[0]:
            continue
        name = clean_str(row[0])
        if not name or name == 'nan' or name.startswith('Profili') or name.startswith('LEGENDA'):
            continue
        if name_prefixes and not name.startswith(name_prefixes):
            continue
        items.append({
            "name": name, "G": clean_val(row[1]), "h": clean_val(row[2]), "b": clean_val(row[3]),
            "tw": clean_val(row[4]), "tf": clean_val(row[5]), "r": clean_val(row[6]),
            "A": clean_val(row[7]), "Iy": clean_val(row[15]), "Wely": clean_val(row[16]),
            "Wply": clean_val(row[17]), "iy": clean_val(row[18]), "Iz": clean_val(row[20]),
            "Welz": clean_val(row[21]), "Wplz": clean_val(row[22]), "iz": clean_val(row[23]),
            "It": clean_val(row[25]), "Iw": clean_val(row[26])
        })
    return items

database["ipe"] = parse_rows(2, 52, ('IPE',))
database["ipn"] = []
for i in range(54, 74):
    row = reader[i]
    if row and row[0].startswith('IPN'):
        database["ipn"].append({
            "name": clean_str(row[0]), "G": clean_val(row[1]), "h": clean_val(row[2]),
            "b": clean_val(row[3]), "tw": clean_val(row[4]), "tf": clean_val(row[5]),
            "r": clean_val(row[6]), "A": clean_val(row[8]), "Iy": clean_val(row[15]),
            "Wely": clean_val(row[16]), "Wply": clean_val(row[17]), "iy": clean_val(row[18]),
            "Iz": clean_val(row[20]), "Welz": clean_val(row[21]), "Wplz": clean_val(row[22]),
            "iz": clean_val(row[23]), "It": clean_val(row[25]), "Iw": clean_val(row[26])
        })

database["he"] = parse_rows(76, 212, ('HE', 'HL'))
database["hd"] = parse_rows(214, 254, ('HD',))
database["hp"] = parse_rows(256, 290, ('HP',))

# Angles
eq_angles = []
for i in range(293, 350):
    row = reader[i]
    if row and row[0].startswith('L '):
        eq_angles.append({
            "name": clean_str(row[0]), "G": clean_val(row[1]), "h": clean_val(row[2]),
            "b": clean_val(row[2]), "t": clean_val(row[3]), "r1": clean_val(row[4]),
            "r2": clean_val(row[5]), "A": clean_val(row[6]), "ys": clean_val(row[7]),
            "zs": clean_val(row[7]), "Iy": clean_val(row[13]), "Iz": clean_val(row[13]),
            "Wely": clean_val(row[14]), "Welz": clean_val(row[14]), "iy": clean_val(row[15]),
            "iz": clean_val(row[15])
        })

uneq_angles = []
for i in range(353, 371):
    row = reader[i]
    if row and row[0].startswith('L '):
        uneq_angles.append({
            "name": clean_str(row[0]), "G": clean_val(row[1]), "h": clean_val(row[2]),
            "b": clean_val(row[3]), "t": clean_val(row[4]), "r1": clean_val(row[5]),
            "r2": clean_val(row[6]), "A": clean_val(row[7]), "zs": clean_val(row[8]),
            "ys": clean_val(row[9]), "Iy": clean_val(row[17]), "Wely": clean_val(row[18]),
            "iy": clean_val(row[19]), "Iz": clean_val(row[20]), "Welz": clean_val(row[21]),
            "iz": clean_val(row[22])
        })
database["angle_equal"] = eq_angles
database["angle_unequal"] = uneq_angles
database["angle"] = eq_angles + uneq_angles

# Channels
upe_list = []
for i in range(374, 390):
    row = reader[i]
    if row and row[0].startswith('UPE'):
        upe_list.append({
            "name": clean_str(row[0]), "G": clean_val(row[1]), "h": clean_val(row[2]),
            "b": clean_val(row[3]), "tw": clean_val(row[4]), "tf": clean_val(row[5]),
            "r": clean_val(row[6]), "A": clean_val(row[7]), "Iy": clean_val(row[15]),
            "Wely": clean_val(row[16]), "Wply": clean_val(row[17]), "iy": clean_val(row[18]),
            "Iz": clean_val(row[20]), "Welz": clean_val(row[21]), "Wplz": clean_val(row[22]),
            "iz": clean_val(row[23]), "It": clean_val(row[25]), "Iw": clean_val(row[26]),
            "ys": clean_val(row[27]), "ym": clean_val(row[28])
        })

upn_list = []
for i in range(392, 409):
    row = reader[i]
    if row and row[0].startswith('UPN'):
        upn_list.append({
            "name": clean_str(row[0]), "G": clean_val(row[1]), "h": clean_val(row[2]),
            "b": clean_val(row[3]), "tw": clean_val(row[4]), "tf": clean_val(row[5]),
            "r1": clean_val(row[6]), "r2": clean_val(row[7]), "A": clean_val(row[8]),
            "Iy": clean_val(row[15]), "Wely": clean_val(row[16]), "Wply": clean_val(row[17]),
            "iy": clean_val(row[18]), "Iz": clean_val(row[20]), "Welz": clean_val(row[21]),
            "Wplz": clean_val(row[22]), "iz": clean_val(row[23]), "It": clean_val(row[25]),
            "Iw": clean_val(row[26]), "ys": clean_val(row[27]), "ym": clean_val(row[28])
        })
database["upe"] = upe_list
database["upn"] = upn_list
database["channel"] = upe_list + upn_list

# CHS
chs_hot = []
for i in range(570, 802):
    row = reader[i]
    d_val, t_val = clean_val(row[1]), clean_val(row[2])
    if d_val and t_val:
        chs_hot.append({"name": f"CHS {d_val:.1f}x{t_val:.1f} (Hot)", "D": d_val, "t": t_val, "G": clean_val(row[3]), "A": clean_val(row[4]), "Iy": clean_val(row[5]), "Iz": clean_val(row[5]), "Wely": clean_val(row[7]), "Welz": clean_val(row[7]), "Wply": clean_val(row[8])})

chs_cold = []
for i in range(803, 1027):
    row = reader[i]
    d_val, t_val = clean_val(row[1]), clean_val(row[2])
    if d_val and t_val:
        chs_cold.append({"name": f"CHS {d_val:.1f}x{t_val:.1f} (Cold)", "D": d_val, "t": t_val, "G": clean_val(row[3]), "A": clean_val(row[4]), "Iy": clean_val(row[5]), "Iz": clean_val(row[5]), "Wely": clean_val(row[7]), "Welz": clean_val(row[7]), "Wply": clean_val(row[8])})
database["chs_hot"] = chs_hot
database["chs_cold"] = chs_cold
database["pipe"] = chs_hot + chs_cold

# SHS
shs_hot = []
for i in range(1029, 1163):
    row = reader[i]
    b_val, t_val = clean_val(row[1]), clean_val(row[2])
    if b_val and t_val:
        shs_hot.append({"name": f"SHS {b_val:.0f}x{b_val:.0f}x{t_val:.1f} (Hot)", "b": b_val, "h": b_val, "t": t_val, "G": clean_val(row[3]), "A": clean_val(row[4]), "Iy": clean_val(row[5]), "Iz": clean_val(row[5]), "Wely": clean_val(row[7]), "Welz": clean_val(row[7]), "Wply": clean_val(row[8])})

shs_cold = []
for i in range(1165, 1309):
    row = reader[i]
    b_val, t_val = clean_val(row[1]), clean_val(row[2])
    if b_val and t_val:
        shs_cold.append({"name": f"SHS {b_val:.0f}x{b_val:.0f}x{t_val:.1f} (Cold)", "b": b_val, "h": b_val, "t": t_val, "G": clean_val(row[3]), "A": clean_val(row[4]), "Iy": clean_val(row[5]), "Iz": clean_val(row[5]), "Wely": clean_val(row[7]), "Welz": clean_val(row[7]), "Wply": clean_val(row[8])})
database["shs_hot"] = shs_hot
database["shs_cold"] = shs_cold

# RHS
rhs_hot = []
for i in range(1310, 1450):
    row = reader[i]
    h_val, b_val, t_val = clean_val(row[1]), clean_val(row[2]), clean_val(row[3])
    if h_val and b_val and t_val:
        rhs_hot.append({"name": f"RHS {h_val:.0f}x{b_val:.0f}x{t_val:.1f} (Hot)", "h": h_val, "b": b_val, "t": t_val, "G": clean_val(row[4]), "A": clean_val(row[5]), "Iy": clean_val(row[6]), "Iz": clean_val(row[7]), "Wely": clean_val(row[10]), "Welz": clean_val(row[11]), "Wply": clean_val(row[12]), "Wplz": clean_val(row[13])})

rhs_cold = []
for i in range(1451, len(reader)):
    row = reader[i]
    if len(row) >= 14:
        h_val, b_val, t_val = clean_val(row[1]), clean_val(row[2]), clean_val(row[3])
        if h_val and b_val and t_val:
            rhs_cold.append({"name": f"RHS {h_val:.0f}x{b_val:.0f}x{t_val:.1f} (Cold)", "h": h_val, "b": b_val, "t": t_val, "G": clean_val(row[4]), "A": clean_val(row[5]), "Iy": clean_val(row[6]), "Iz": clean_val(row[7]), "Wely": clean_val(row[10]), "Welz": clean_val(row[11]), "Wply": clean_val(row[12]), "Wplz": clean_val(row[13])})
database["rhs_hot"] = rhs_hot
database["rhs_cold"] = rhs_cold

database["box"] = shs_hot + shs_cold + rhs_hot + rhs_cold

js_content = f"/**\n * Structural Pulse - European Steel Section Database\n * Generated directly from PROFILES.csv (No dependencies required)\n */\n\nconst sectionDatabase = {json.dumps(database, indent=2)};\n\nif (typeof module !== 'undefined' && module.exports) {{\n    module.exports = sectionDatabase;\n}}\n"

with open('section-database.js', 'w', encoding='utf-8') as out_f:
    out_f.write(js_content)

print("Generated section-database.js successfully!")