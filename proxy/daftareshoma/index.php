<?php
/**
 * Rafiei DaftareShoma proxy (Iran-hosted). Compatible with PHP 7.0+ (and 8.x).
 * Works with the cURL extension, or falls back to PHP streams when cURL is missing.
 *
 * Request from backend:
 *   POST ?target=<absolute https URL on *.daftareshoma.com>
 *   Authorization: Bearer <DAFTARESHOMA_PROXY_SECRET>   (or X-Proxy-Secret: <secret>)
 *   X-Upstream-Authorization: Bearer <provider token>   (forwarded as Authorization)
 *   X-Upstream-Method: GET|POST                          (default POST)
 *   body: forwarded as-is
 * Health check: GET ?ping=1 with the same secret header.
 * Every response carries X-Rafiei-Proxy so the backend can tell proxy errors from provider errors.
 */
error_reporting(0);
ini_set('display_errors', '0');
header('X-Content-Type-Options: nosniff');
header('X-Rafiei-Proxy: 2');

$secret = getenv('DAFTARESHOMA_PROXY_SECRET') ?: 'CHANGE_ME_LONG_RANDOM_SECRET';

function fail($s, $m) {
  http_response_code($s);
  header('Content-Type: application/json');
  echo json_encode(array('success' => false, 'proxy_error' => $m));
  exit;
}
function ends_with($h, $n) { $l = strlen($n); return $l === 0 || substr($h, -$l) === $n; }

register_shutdown_function(function () {
  $e = error_get_last();
  if ($e && in_array($e['type'], array(E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR), true)) {
    if (!headers_sent()) { http_response_code(500); header('Content-Type: application/json'); }
    echo json_encode(array('success' => false, 'proxy_error' => 'php fatal: ' . $e['message'] . ' line ' . $e['line']));
  }
});

$auth = '';
foreach (array('HTTP_AUTHORIZATION', 'REDIRECT_HTTP_AUTHORIZATION') as $k) if (!empty($_SERVER[$k])) { $auth = $_SERVER[$k]; break; }
if ($auth === '' && function_exists('getallheaders')) {
  foreach (getallheaders() as $k => $v) if (strtolower($k) === 'authorization') $auth = $v;
}
$alt = isset($_SERVER['HTTP_X_PROXY_SECRET']) ? $_SERVER['HTTP_X_PROXY_SECRET'] : '';
$ok = $secret !== 'CHANGE_ME_LONG_RANDOM_SECRET'
  && (hash_equals('Bearer ' . $secret, $auth) || ($alt !== '' && hash_equals($secret, $alt)));
if (!$ok) fail(401, 'unauthorized');

if (isset($_GET['ping'])) {
  header('Content-Type: application/json');
  echo json_encode(array('success' => true, 'php' => PHP_VERSION, 'curl' => function_exists('curl_init'),
    'openssl' => extension_loaded('openssl')));
  exit;
}

$target = isset($_GET['target']) ? $_GET['target'] : '';
$p = parse_url($target);
$host = strtolower(isset($p['host']) ? $p['host'] : '');
$scheme = isset($p['scheme']) ? $p['scheme'] : '';
if ($scheme !== 'https' || !($host === 'daftareshoma.com' || ends_with($host, '.daftareshoma.com'))) fail(400, 'target not allowed');

$method = strtoupper(isset($_SERVER['HTTP_X_UPSTREAM_METHOD']) ? $_SERVER['HTTP_X_UPSTREAM_METHOD'] : 'POST');
if (!in_array($method, array('GET', 'POST'), true)) fail(400, 'method not allowed');

$headers = array('Accept: ' . (isset($_SERVER['HTTP_ACCEPT']) ? $_SERVER['HTTP_ACCEPT'] : '*/*'), 'Expect:');
if (!empty($_SERVER['HTTP_X_UPSTREAM_AUTHORIZATION'])) $headers[] = 'Authorization: ' . $_SERVER['HTTP_X_UPSTREAM_AUTHORIZATION'];
$ct = !empty($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : (!empty($_SERVER['HTTP_CONTENT_TYPE']) ? $_SERVER['HTTP_CONTENT_TYPE'] : '');
if ($ct !== '') $headers[] = 'Content-Type: ' . $ct;
if (!empty($_SERVER['HTTP_ACCEPT_LANGUAGE'])) $headers[] = 'Accept-Language: ' . $_SERVER['HTTP_ACCEPT_LANGUAGE'];
if (!empty($_SERVER['HTTP_MCP_SESSION_ID'])) $headers[] = 'Mcp-Session-Id: ' . $_SERVER['HTTP_MCP_SESSION_ID'];
$body = $method === 'POST' ? file_get_contents('php://input') : null;

$status = 0; $rawHeaders = array(); $respBody = '';
if (function_exists('curl_init')) {
  $ch = curl_init($target);
  curl_setopt_array($ch, array(CURLOPT_CUSTOMREQUEST => $method, CURLOPT_HTTPHEADER => $headers,
    CURLOPT_RETURNTRANSFER => true, CURLOPT_HEADER => true, CURLOPT_TIMEOUT => 60, CURLOPT_FOLLOWLOCATION => false));
  if ($method === 'POST') curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
  $resp = curl_exec($ch);
  if ($resp === false) fail(502, 'upstream unreachable: ' . curl_error($ch));
  $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
  $hsize = (int)curl_getinfo($ch, CURLINFO_HEADER_SIZE);
  $rawHeaders = explode("\r\n", substr($resp, 0, $hsize));
  $respBody = (string)substr($resp, $hsize);
} else {
  $ctx = stream_context_create(array('http' => array('method' => $method, 'header' => implode("\r\n", $headers),
    'content' => $body === null ? '' : $body, 'timeout' => 60, 'ignore_errors' => true, 'follow_location' => 0)));
  $respBody = @file_get_contents($target, false, $ctx);
  if ($respBody === false) { $e = error_get_last(); fail(502, 'upstream unreachable: ' . ($e ? $e['message'] : 'unknown')); }
  $rawHeaders = isset($http_response_header) ? $http_response_header : array();
  foreach ($rawHeaders as $h) if (preg_match('#^HTTP/\S+\s+(\d{3})#', $h, $m)) $status = (int)$m[1];
}

foreach ($rawHeaders as $h) {
  if (preg_match('/^(content-type|mcp-session-id|content-disposition):/i', $h)) header($h);
}
header('X-Upstream-Status: ' . $status);
http_response_code($status > 0 ? $status : 502);
echo $respBody;
