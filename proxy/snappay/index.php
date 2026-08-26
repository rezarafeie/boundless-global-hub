<?php
/**
 * Rafiei SnappPay payment proxy
 * ---------------------------------------------------------------
 * Deploy this single file at:  https://rafeie.com/snappay/index.php
 * (must be served from the static public IP 45.139.11.73, which is
 *  the IP whitelisted by SnappPay for this merchant)
 *
 * The Rafiei Academy backend (Supabase Edge Functions) calls this proxy;
 * the proxy is the ONLY component that talks to https://api.snapppay.ir
 * and the ONLY place that holds SnappPay credentials.
 *
 * Internal routes (called by Academy backend, NOT SnappPay routes):
 *   POST  /snappay/?route=eligibility
 *   POST  /snappay/?route=create
 *   POST  /snappay/?route=verify
 *   POST  /snappay/?route=settle
 *   GET   /snappay/?route=status&paymentToken=...
 *   POST  /snappay/?route=cancel
 *   POST  /snappay/?route=update
 *   GET   /snappay/?route=health
 *
 * Path style is also supported when mod_rewrite sends PATH_INFO:
 *   POST /snappay/create
 *
 * Auth: every request MUST carry
 *   Authorization: Bearer <RAFIEI_INTERNAL_PAYMENT_PROXY_SECRET>
 * The same value is stored in Supabase as SNAPPPAY_PROXY_SECRET.
 */

declare(strict_types=1);

// ---------------------------------------------------------------
// 1. CONFIGURATION  — fill these in on the server (or use env vars)
// ---------------------------------------------------------------
const SNAPPPAY_BASE_URL = 'https://api.snapppay.ir';

function cfg(string $key, string $fallback = ''): string {
    $v = getenv($key);
    return ($v === false || $v === '') ? $fallback : (string) $v;
}

// Shared secret between Academy backend and this proxy.
$PROXY_SECRET       = cfg('RAFIEI_INTERNAL_PAYMENT_PROXY_SECRET', 'CHANGE_ME_LONG_RANDOM_SECRET');

// SnappPay merchant credentials (provided by SnappPay).
$SNAPPPAY_CLIENT_ID     = cfg('SNAPPPAY_CLIENT_ID', 'CHANGE_ME_CLIENT_ID');
$SNAPPPAY_CLIENT_SECRET = cfg('SNAPPPAY_CLIENT_SECRET', 'CHANGE_ME_CLIENT_SECRET');
$SNAPPPAY_USERNAME      = cfg('SNAPPPAY_USERNAME', 'CHANGE_ME_USERNAME');
$SNAPPPAY_PASSWORD      = cfg('SNAPPPAY_PASSWORD', 'CHANGE_ME_PASSWORD');

// Where the OAuth token cache is written (must be writable, non-public).
$TOKEN_CACHE_FILE = sys_get_temp_dir() . '/snapppay_token_cache.json';

// Optional: log file for troubleshooting (set to '' to disable).
$LOG_FILE = sys_get_temp_dir() . '/snapppay_proxy.log';

// ---------------------------------------------------------------
// 2. HELPERS
// ---------------------------------------------------------------
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
// No CORS headers on purpose: this endpoint is server-to-server only.

function respond(int $status, array $body): void {
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function proxy_log(string $message): void {
    global $LOG_FILE;
    if ($LOG_FILE === '') return;
    @file_put_contents(
        $LOG_FILE,
        '[' . gmdate('c') . '] ' . $message . PHP_EOL,
        FILE_APPEND | LOCK_EX
    );
}

function bearer_token(): string {
    $header = '';
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $header = (string) $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $header = (string) $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    } elseif (function_exists('apache_request_headers')) {
        $h = apache_request_headers();
        foreach ($h as $k => $v) {
            if (strtolower($k) === 'authorization') { $header = (string) $v; break; }
        }
    }
    if (stripos($header, 'bearer ') === 0) {
        return trim(substr($header, 7));
    }
    return '';
}

function current_route(): string {
    $route = isset($_GET['route']) ? (string) $_GET['route'] : '';
    if ($route === '' && !empty($_SERVER['PATH_INFO'])) {
        $route = trim((string) $_SERVER['PATH_INFO'], '/');
    }
    if ($route === '') {
        // Fallback: last path segment, e.g. /snappay/create
        $path  = parse_url((string) ($_SERVER['REQUEST_URI'] ?? ''), PHP_URL_PATH) ?: '';
        $parts = array_values(array_filter(explode('/', $path)));
        $last  = end($parts);
        if ($last && $last !== 'index.php' && $last !== 'snappay') {
            $route = (string) $last;
        }
    }
    return strtolower(trim($route));
}

function read_json_body(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

// ---------------------------------------------------------------
// 3. SNAPPPAY OAUTH TOKEN (cached until ~60s before expiry)
// ---------------------------------------------------------------
function read_cached_token(): ?string {
    global $TOKEN_CACHE_FILE;
    if (!is_readable($TOKEN_CACHE_FILE)) return null;
    $raw = @file_get_contents($TOKEN_CACHE_FILE);
    if (!$raw) return null;
    $data = json_decode($raw, true);
    if (!is_array($data) || empty($data['access_token']) || empty($data['expires_at'])) return null;
    if ((int) $data['expires_at'] <= time()) return null;
    return (string) $data['access_token'];
}

function store_cached_token(string $token, int $expiresIn): void {
    global $TOKEN_CACHE_FILE;
    // Expire the local cache ~60s before SnappPay does.
    $expiresAt = time() + max(30, $expiresIn - 60);
    @file_put_contents(
        $TOKEN_CACHE_FILE,
        json_encode(['access_token' => $token, 'expires_at' => $expiresAt]),
        LOCK_EX
    );
    @chmod($TOKEN_CACHE_FILE, 0600);
}

function invalidate_cached_token(): void {
    global $TOKEN_CACHE_FILE;
    @unlink($TOKEN_CACHE_FILE);
}

function fetch_access_token(): string {
    global $SNAPPPAY_CLIENT_ID, $SNAPPPAY_CLIENT_SECRET, $SNAPPPAY_USERNAME, $SNAPPPAY_PASSWORD;

    $basic = base64_encode($SNAPPPAY_CLIENT_ID . ':' . $SNAPPPAY_CLIENT_SECRET);
    $body  = http_build_query([
        'grant_type' => 'password',
        'scope'      => 'online-merchant',
        'username'   => $SNAPPPAY_USERNAME,
        'password'   => $SNAPPPAY_PASSWORD,
    ]);

    $ch = curl_init(SNAPPPAY_BASE_URL . '/api/online/v1/oauth/token');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $body,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/x-www-form-urlencoded',
            'Authorization: Basic ' . $basic,
            'User-Agent: SnappPay, ' . $SNAPPPAY_CLIENT_ID,
            'Accept: application/json',
        ],
    ]);
    $res  = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err  = curl_error($ch);
    curl_close($ch);

    if ($res === false) {
        proxy_log('token curl error: ' . $err);
        respond(502, ['successful' => false, 'error' => 'snapppay_token_network_error']);
    }

    $data = json_decode((string) $res, true);
    if ($code < 200 || $code >= 300 || empty($data['access_token'])) {
        proxy_log('token failed http=' . $code . ' body=' . substr((string) $res, 0, 500));
        respond(502, ['successful' => false, 'error' => 'snapppay_token_failed', 'status' => $code]);
    }

    $token     = (string) $data['access_token'];
    $expiresIn = isset($data['expires_in']) ? (int) $data['expires_in'] : 3600;
    store_cached_token($token, $expiresIn);
    return $token;
}

function get_access_token(bool $forceRefresh = false): string {
    if (!$forceRefresh) {
        $cached = read_cached_token();
        if ($cached !== null) return $cached;
    }
    invalidate_cached_token();
    return fetch_access_token();
}

// ---------------------------------------------------------------
// 4. SNAPPPAY API CALL (single retry on 401)
// ---------------------------------------------------------------
function snapppay_call(string $method, string $path, ?array $payload, array $query = []): array {
    global $SNAPPPAY_CLIENT_ID;

    $attempt = 0;
    $forceRefresh = false;

    while (true) {
        $attempt++;
        $token = get_access_token($forceRefresh);

        $url = SNAPPPAY_BASE_URL . $path;
        if (!empty($query)) {
            $url .= (strpos($url, '?') === false ? '?' : '&') . http_build_query($query);
        }

        $ch = curl_init($url);
        $headers = [
            'Authorization: Bearer ' . $token,
            'Content-Type: application/json',
            'Accept: application/json',
            'User-Agent: SnappPay, ' . $SNAPPPAY_CLIENT_ID,
        ];
        $opts = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 40,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_CUSTOMREQUEST  => strtoupper($method),
        ];
        if ($payload !== null && strtoupper($method) !== 'GET') {
            $opts[CURLOPT_POSTFIELDS] = json_encode($payload, JSON_UNESCAPED_UNICODE);
        }
        curl_setopt_array($ch, $opts);

        $res  = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err  = curl_error($ch);
        curl_close($ch);

        if ($res === false) {
            proxy_log("call $path curl error: $err");
            return ['status' => 502, 'body' => ['successful' => false, 'error' => 'network_error', 'message' => $err]];
        }

        // Auth failure -> refresh token once and retry the original request.
        if ($code === 401 && $attempt === 1) {
            proxy_log("call $path got 401, refreshing token and retrying once");
            $forceRefresh = true;
            continue;
        }

        $body = json_decode((string) $res, true);
        if (!is_array($body)) {
            $body = ['successful' => false, 'raw' => substr((string) $res, 0, 2000)];
        }
        proxy_log("call $path http=$code");
        return ['status' => $code, 'body' => $body];
    }
}

// ---------------------------------------------------------------
// 5. AUTHENTICATE THE CALLER
// ---------------------------------------------------------------
$route = current_route();

if ($route === 'health') {
    respond(200, ['successful' => true, 'service' => 'rafiei-snapppay-proxy', 'time' => gmdate('c')]);
}

// Public provider callback. SnappPay only accepts the merchant's whitelisted
// rafeie.com domain, so forward its callback parameters to Academy checkout.
if ($route === 'callback') {
    $params = $_GET;
    unset($params['route']);
    $target = 'https://academy.rafiei.co/enroll/success';
    if (!empty($params)) $target .= '?' . http_build_query($params);
    header('Location: ' . $target, true, 302);
    exit;
}

$provided = bearer_token();
if ($provided === '' || !hash_equals($PROXY_SECRET, $provided)) {
    proxy_log('unauthorized request from ' . ($_SERVER['REMOTE_ADDR'] ?? '?') . ' route=' . $route);
    respond(401, ['successful' => false, 'error' => 'unauthorized']);
}

// ---------------------------------------------------------------
// 6. ROUTING
// ---------------------------------------------------------------
$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
$input  = read_json_body();

switch ($route) {
    case 'eligibility': {
        // amount in Rial (server-computed by Academy backend)
        $amount = isset($input['amount']) ? (int) $input['amount'] : 0;
        if ($amount <= 0) respond(400, ['successful' => false, 'error' => 'invalid_amount']);
        $r = snapppay_call('GET', '/api/online/offer/v1/eligible', null, ['amount' => $amount]);
        respond($r['status'], $r['body']);
    }

    case 'create': {
        if ($method !== 'POST') respond(405, ['successful' => false, 'error' => 'method_not_allowed']);
        foreach (['amount', 'returnURL', 'transactionId', 'cartList'] as $required) {
            if (!isset($input[$required])) {
                respond(400, ['successful' => false, 'error' => 'missing_field', 'field' => $required]);
            }
        }
        $r = snapppay_call('POST', '/api/online/payment/v1/token', $input);
        respond($r['status'], $r['body']);
    }

    case 'verify':
    case 'settle':
    case 'cancel': {
        if ($method !== 'POST') respond(405, ['successful' => false, 'error' => 'method_not_allowed']);
        $paymentToken = isset($input['paymentToken']) ? (string) $input['paymentToken'] : '';
        if ($paymentToken === '') respond(400, ['successful' => false, 'error' => 'missing_payment_token']);
        $r = snapppay_call('POST', '/api/online/payment/v1/' . $route, ['paymentToken' => $paymentToken]);
        respond($r['status'], $r['body']);
    }

    case 'update': {
        if ($method !== 'POST') respond(405, ['successful' => false, 'error' => 'method_not_allowed']);
        if (empty($input['paymentToken'])) respond(400, ['successful' => false, 'error' => 'missing_payment_token']);
        $r = snapppay_call('POST', '/api/online/payment/v1/update', $input);
        respond($r['status'], $r['body']);
    }

    case 'status': {
        $paymentToken = (string) ($_GET['paymentToken'] ?? ($input['paymentToken'] ?? ''));
        if ($paymentToken === '') respond(400, ['successful' => false, 'error' => 'missing_payment_token']);
        $r = snapppay_call('GET', '/api/online/payment/v1/status', null, ['paymentToken' => $paymentToken]);
        respond($r['status'], $r['body']);
    }

    default:
        respond(404, ['successful' => false, 'error' => 'unknown_route', 'route' => $route]);
}
