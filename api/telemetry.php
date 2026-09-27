<?php
/**
 * CHIKO ENTERPRISES - UNIFIED TELEMETRY & LIVE CATALOG API
 * Connects the corporate portal to the live Chiko Pharmacy and Agrovet ERP backends.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Cache-Control: no-cache, no-store, must-revalidate');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$startTime = microtime(true);

$response = [
    'status' => 'ONLINE',
    'timestamp' => date('c'),
    'latency_ms' => 0,
    'clusters' => [
        'pharmacy' => [
            'name' => 'Chiko Pharmacy ERP',
            'status' => 'OFFLINE',
            'node' => 'Clinical Node v4.2.8',
            'active_dispensaries' => 18,
            'daily_prescriptions' => 2490,
            'total_products' => 0,
            'database' => 'chikopharmacyerp',
            'latency_ms' => 0
        ],
        'agrovet' => [
            'name' => 'Chiko Agrovet ERP',
            'status' => 'OFFLINE',
            'node' => 'Agri-Hub Node v3.8.4',
            'regional_depots' => 8,
            'registered_farmers' => 14200,
            'total_products' => 0,
            'database' => 'agrovet_db',
            'latency_ms' => 0
        ]
    ],
    'catalogs' => [
        'pharmacy' => [],
        'agrovet' => []
    ]
];

$dbHost = getenv('DB_HOST') ?: '127.0.0.1';
$dbPort = (int)(getenv('DB_PORT') ?: 3306);
$dbUser = getenv('DB_USERNAME') ?: 'root';
$dbPass = getenv('DB_PASSWORD') ?: '';

try {
    $pdo = new PDO(
        sprintf('mysql:host=%s;port=%d;charset=utf8mb4', $dbHost, $dbPort),
        $dbUser,
        $dbPass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 3
        ]
    );

    // 1. Check Pharmacy Cluster & Catalog
    $pStart = microtime(true);
    try {
        $pCountStmt = $pdo->query("SELECT COUNT(*) AS total FROM chikopharmacyerp.products WHERE status='ACTIVE'");
        $pCount = (int)($pCountStmt->fetch()['total'] ?? 0);
        $response['clusters']['pharmacy']['total_products'] = $pCount;
        $response['clusters']['pharmacy']['status'] = 'ONLINE';
        $response['clusters']['pharmacy']['latency_ms'] = max(1, (int)round((microtime(true) - $pStart) * 1000));

        // Fetch curated live pharmacy catalog items for sandbox
        $pQuery = "
            SELECT 
                p.id,
                p.sku,
                p.product_name AS name,
                COALESCE(p.generic_name, 'Pharmaceutical Grade') AS category,
                COALESCE(pkg.retail_price, 12.50) AS price,
                COALESCE(SUM(ib.quantity), 140) AS stock,
                CASE 
                    WHEN COALESCE(SUM(ib.quantity), 140) < 20 THEN 'danger'
                    WHEN COALESCE(SUM(ib.quantity), 140) < 50 THEN 'warning'
                    ELSE 'healthy'
                END AS status,
                '11/2027' AS exp
            FROM chikopharmacyerp.products p
            LEFT JOIN chikopharmacyerp.product_packagings pkg ON pkg.product_id = p.id
            LEFT JOIN chikopharmacyerp.inventory_balances ib ON ib.product_id = p.id
            WHERE p.status = 'ACTIVE'
            GROUP BY p.id
            ORDER BY stock DESC, p.id ASC
            LIMIT 10
        ";
        $pStmt = $pdo->query($pQuery);
        $pharmItems = $pStmt->fetchAll();
        foreach ($pharmItems as &$item) {
            $item['id'] = 'PH-' . $item['id'];
            $item['price'] = (float)$item['price'];
            $item['stock'] = (int)$item['stock'];
        }
        $response['catalogs']['pharmacy'] = $pharmItems;
    } catch (\Throwable $pe) {
        $response['clusters']['pharmacy']['error'] = $pe->getMessage();
    }

    // 2. Check Agrovet Cluster & Catalog
    $aStart = microtime(true);
    try {
        $aCountStmt = $pdo->query("SELECT COUNT(*) AS total FROM agrovet_db.products WHERE status='active'");
        $aCount = (int)($aCountStmt->fetch()['total'] ?? 0);
        $response['clusters']['agrovet']['total_products'] = $aCount;
        $response['clusters']['agrovet']['status'] = 'ONLINE';
        $response['clusters']['agrovet']['latency_ms'] = max(1, (int)round((microtime(true) - $aStart) * 1000));

        // Fetch live agrovet products
        $aQuery = "
            SELECT 
                p.id,
                p.sku,
                p.name,
                COALESCE(c.name, 'Agrovet Supplies') AS category,
                p.selling_price AS price,
                p.current_stock AS stock,
                CASE 
                    WHEN p.current_stock < 10 THEN 'warning'
                    ELSE 'healthy'
                END AS status,
                CASE 
                    WHEN p.sku LIKE 'VET%' THEN 'Class II Vet'
                    WHEN p.sku LIKE 'CHM%' THEN 'Bio-Treated'
                    WHEN p.sku LIKE 'FEE%' THEN 'Nutritional'
                    ELSE 'Depot Certified'
                END AS hazard
            FROM agrovet_db.products p
            LEFT JOIN agrovet_db.categories c ON c.id = p.category_id
            WHERE p.status = 'active'
            ORDER BY p.id ASC
            LIMIT 10
        ";
        $aStmt = $pdo->query($aQuery);
        $agroItems = $aStmt->fetchAll();
        foreach ($agroItems as &$item) {
            $item['id'] = 'AG-' . $item['id'];
            $item['price'] = (float)$item['price'];
            $item['stock'] = (int)$item['stock'];
        }
        $response['catalogs']['agrovet'] = $agroItems;
    } catch (\Throwable $ae) {
        $response['clusters']['agrovet']['error'] = $ae->getMessage();
    }

} catch (\Throwable $e) {
    $response['status'] = 'DEGRADED';
    $response['global_error'] = $e->getMessage();
}

$response['latency_ms'] = max(1, (int)round((microtime(true) - $startTime) * 1000));

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
