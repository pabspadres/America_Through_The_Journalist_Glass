# Original image dimensions
img_width = 1640
img_height = 2360

# New York coordinates from the image map
ny1_coords = "1188,557,1183,634,1230,757,1230,835,1263,937,1256,950,1231,966,1215,966,1208,962,1201,951,1195,948,1179,946,1169,937,1159,930,1157,915,1147,911,1135,915,1122,888,1121,880,1108,875,1104,869,783,940,780,915,803,897,808,887,829,871,833,859,840,854,840,836,837,830,824,834,819,832,817,829,829,817,824,811,820,804,836,790,845,774,856,769,874,766,891,762,910,761,923,756,926,750,937,748,953,746,969,737,972,732,988,724,991,714,990,707,985,701,998,700,1005,688,998,677,988,675,976,674,984,665,1003,650,1014,636,1030,608,1037,597,1062,582,1071,577,1110,569,1134,562"

ny2_coords = "1294,980,1311,967,1320,960,1336,953,1343,953,1363,941,1379,935,1385,929,1395,926,1402,916,1411,909,1421,896,1423,887,1413,889,1407,900,1402,908,1397,915,1386,919,1376,924,1369,921,1381,906,1388,899,1388,896,1381,896,1373,900,1366,908,1352,918,1347,921,1340,929,1329,934,1311,947,1285,945,1281,941,1275,945,1273,955,1268,961,1260,967,1263,976,1271,982,1279,982"

def analyze_coords(coords_str, name):
    coords = [int(x) for x in coords_str.split(',')]
    x_coords = coords[::2]  # Every even index
    y_coords = coords[1::2]  # Every odd index
    
    min_x, max_x = min(x_coords), max(x_coords)
    min_y, max_y = min(y_coords), max(y_coords)
    
    # Convert to percentages
    min_x_pct = (min_x / img_width) * 100
    max_x_pct = (max_x / img_width) * 100
    min_y_pct = (min_y / img_height) * 100
    max_y_pct = (max_y / img_height) * 100
    
    print(f"{name}:")
    print(f"  X range: {min_x}-{max_x} pixels ({min_x_pct:.1f}%-{max_x_pct:.1f}%)")
    print(f"  Y range: {min_y}-{max_y} pixels ({min_y_pct:.1f}%-{max_y_pct:.1f}%)")
    print()

analyze_coords(ny1_coords, "New York 1")
analyze_coords(ny2_coords, "New York 2")
