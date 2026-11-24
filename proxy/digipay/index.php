<?php
/**
 * Rafiei DigiPay payment proxy (server-to-server, PHP 7+ with cURL)
 * Deploy at: https://rafeie.com/digipay/index.php  (Iranian host)
 *
 * Internal routes (Authorization: Bearer <DIGIPAY_PROXY_SECRET>):
 *   POST ?route=ticket   {amount, cellNumber, providerId, callbackUrl, basketDetailsDto}
 *   POST ?route=verify   {trackingCode, providerId, type}
 *   POST ?route=refund   {amount, providerId, trackingCode, type, reason?}
 *   GET  ?route=health | ?ping=1
 * Public route (called by DigiPay with POST form data):
 *   ?route=callback&... -> 302 to https://academy.rafiei.co/enroll/success?...
 */

function cfg($key, $fallback = '') { $v = getenv($key); return ($v === false || $v === '') ? $fallback : (string)$v; }

$PROXY_SECRET   = cfg('DIGIPAY_PROXY_SECRET', 'CHANGE_ME_LONG_RANDOM_SECRET');
$CLIENT_ID      = cfg('DIGIPAY_CLIENT_ID', 'CHANGE_ME_CLIENT_ID');
$CLIENT_SECRET  = cfg('DIGIPAY_CLIENT_SECRET', 'CHANGE_ME_CLIENT_SECRET');
$USERNAME       = cfg('DIGIPAY_USERNAME', 'CHANGE_ME_USERNAME');
$PASSWORD       = cfg('DIGIPAY_PASSWORD', 'CHANGE_ME_PASSWORD');
$LIVE           = cfg('DIGIPAY_LIVE', '1') === '1';   // 0 = UAT sandbox
$TICKET_TYPE    = cfg('DIGIPAY_TICKET_TYPE', '11');   // same as official WP plugin
$ACADEMY_RETURN = 'https://academy.rafiei.co/enroll/success';
$BASE           = $LIVE ? 'https://api.mydigipay.com/digipay/api/' : 'https://uat.mydigipay.info/digipay/api/';
$TOKEN_FILE     = sys_get_temp_dir() . '/digipay_token_cache.json';
$LOG_FILE       = sys_get_temp_dir() . '/digipay_proxy.log';

function respond($status, $body) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function plog($m) { global $LOG_FILE; @file_put_contents($LOG_FILE, '[' . gmdate('c') . "] $m\n", FILE_APPEND | LOCK_EX); }

function bearer() {
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
    if ($h === '' && function_exists('apache_request_headers')) {
        foreach (apache_request_headers() as $k => $v) if (strtolower($k) === 'authorization') $h = $v;
    }
    return stripos($h, 'bearer ') === 0 ? trim(substr($h, 7)) : '';
}

function http_call($method, $url, $headers, $body) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 40,
        CURLOPT_HTTPHEADER => $headers,
    ]);
    if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    $res = curl_exec($ch); $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); $err = curl_error($ch); curl_close($ch);
    return [$code, $res, $err];
}

function base_headers($json) {
    return [
        'Content-Type: ' . ($json ? 'application/json' : 'application/x-www-form-urlencoded; charset=utf-8'),
        'Agent: WEB', 'Digipay-Version: 2022-02-02', 'Plugin-Version: 1.6.17', 'Accept: application/json',
    ];
}

function get_token($force = false) {
    global $TOKEN_FILE, $BASE, $CLIENT_ID, $CLIENT_SECRET, $USERNAME, $PASSWORD;
    if (!$force && is_readable($TOKEN_FILE)) {
        $c = json_decode((string)@file_get_contents($TOKEN_FILE), true);
        if (!empty($c['access_token']) && (int)($c['expires_at'] ?? 0) > time()) return $c['access_token'];
    }
    $h = array_merge(base_headers(false), ['Authorization: Basic ' . base64_encode("$CLIENT_ID:$CLIENT_SECRET")]);
    list($code, $res, $err) = http_call('POST', $BASE . 'oauth/token', $h,
        http_build_query(['username' => $USERNAME, 'password' => $PASSWORD, 'grant_type' => 'password']));
    $d = json_decode((string)$res, true);
    if ($code !== 200 || empty($d['access_token'])) {
        plog("token failed http=$code err=$err body=" . substr((string)$res, 0, 400));
        respond(502, ['successful' => false, 'error' => 'digipay_token_failed', 'status' => $code]);
    }
    $exp = isset($d['expires_in']) ? (int)$d['expires_in'] : 3600;
    @file_put_contents($TOKEN_FILE, json_encode(['access_token' => $d['access_token'], 'expires_at' => time() + max(30, $exp - 60)]), LOCK_EX);
    @chmod($TOKEN_FILE, 0600);
    return $d['access_token'];
}

function dp_call($path, $payload) {
    global $BASE;
    for ($attempt = 1; $attempt <= 2; $attempt++) {
        $token = get_token($attempt === 2);
        list($code, $res, $err) = http_call('POST', $BASE . $path,
            array_merge(base_headers(true), ['Authorization: Bearer ' . $token]),
            json_encode($payload, JSON_UNESCAPED_UNICODE));
        if ($res === false) return [502, ['successful' => false, 'error' => 'network_error', 'message' => $err]];
        if ($code === 401 && $attempt === 1) { plog("$path 401, refreshing token"); continue; }
        $body = json_decode((string)$res, true);
        if (!is_array($body)) $body = ['raw' => substr((string)$res, 0, 2000)];
        plog("$path http=$code status=" . ($body['result']['status'] ?? '?'));
        return [$code, $body];
    }
}

$route = strtolower((string)($_GET['route'] ?? ''));
if ($route === 'health' || isset($_GET['ping'])) {
    respond(200, ['successful' => true, 'service' => 'rafiei-digipay-proxy', 'live' => $LIVE, 'curl' => function_exists('curl_init'), 'time' => gmdate('c')]);
}

// DigiPay POSTs result/amount/trackingCode/type here; forward them to Academy as GET.
if ($route === 'callback') {
    $params = $_GET; unset($params['route']);
    foreach (['result', 'amount', 'trackingCode', 'type', 'providerId'] as $k) {
        if (isset($_POST[$k])) $params[$k] = (string)$_POST[$k];
    }
    header('Location: ' . $ACADEMY_RETURN . '?' . http_build_query($params), true, 302);
    exit;
}

$given = bearer();
if ($given === '' || !hash_equals($PROXY_SECRET, $given)) {
    plog('unauthorized ' . ($_SERVER['REMOTE_ADDR'] ?? '?') . " route=$route");
    respond(401, ['successful' => false, 'error' => 'unauthorized']);
}
if (strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') respond(405, ['successful' => false, 'error' => 'method_not_allowed']);
$in = json_decode((string)file_get_contents('php://input'), true) ?: [];

switch ($route) {
    case 'ticket':
        foreach (['amount', 'providerId', 'callbackUrl'] as $f) if (empty($in[$f])) respond(400, ['successful' => false, 'error' => "missing_$f"]);
        list($c, $b) = dp_call('tickets/business?type=' . rawurlencode($TICKET_TYPE), $in);
        respond($c, $b);
    case 'verify':
        if (empty($in['trackingCode']) || empty($in['providerId'])) respond(400, ['successful' => false, 'error' => 'missing_fields']);
        $type = preg_replace('/\D/', '', (string)($in['type'] ?? '0')) ?: '0';
        // 9011 = pending; retry up to 3 times like the official plugin.
        for ($i = 0; $i < 4; $i++) {
            list($c, $b) = dp_call('purchases/verify?type=' . $type, ['trackingCode' => (string)$in['trackingCode'], 'providerId' => (string)$in['providerId']]);
            if ((int)($b['result']['status'] ?? -1) !== 9011) break;
            sleep(5);
        }
        respond($c, $b);
    case 'refund':
        $type = preg_replace('/\D/', '', (string)($in['type'] ?? '0')) ?: '0';
        list($c, $b) = dp_call('refunds?type=' . $type, $in);
        respond($c, $b);
    default:
        respond(404, ['successful' => false, 'error' => 'unknown_route']);
}
