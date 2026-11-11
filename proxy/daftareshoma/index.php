<?php
/**
 * Rafiei DaftareShoma proxy (Iran-hosted).
 * DaftareShoma is not reachable from outside Iran, so Academy backend calls
 * go through this file. Deploy at e.g. https://rafeie.com/daftareshoma/index.php
 *
 * Request from backend:
 *   POST ?target=<absolute https URL on *.daftareshoma.com>
 *   Authorization: Bearer <DAFTARESHOMA_PROXY_SECRET>
 *   X-Upstream-Authorization: Bearer <provider token>   (forwarded as Authorization)
 *   X-Upstream-Method: GET|POST                          (default POST)
 *   body: forwarded as-is
 * Only HTTPS hosts ending in daftareshoma.com are allowed.
 */
header('X-Content-Type-Options: nosniff');
$secret = getenv('DAFTARESHOMA_PROXY_SECRET') ?: 'CHANGE_ME_LONG_RANDOM_SECRET';
function fail(int $s, string $m) { http_response_code($s); header('Content-Type: application/json'); echo json_encode(['success'=>false,'error'=>$m]); exit; }
$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
if ($secret === 'CHANGE_ME_LONG_RANDOM_SECRET' || !hash_equals('Bearer ' . $secret, $auth)) fail(401, 'unauthorized');
$target = $_GET['target'] ?? '';
$p = parse_url($target);
$host = strtolower($p['host'] ?? '');
if (($p['scheme'] ?? '') !== 'https' || !($host === 'daftareshoma.com' || str_ends_with($host, '.daftareshoma.com'))) fail(400, 'target not allowed');
$method = strtoupper($_SERVER['HTTP_X_UPSTREAM_METHOD'] ?? 'POST');
if (!in_array($method, ['GET','POST'], true)) fail(400, 'method not allowed');
$headers = ['Accept: ' . ($_SERVER['HTTP_ACCEPT'] ?? '*/*')];
if (!empty($_SERVER['HTTP_X_UPSTREAM_AUTHORIZATION'])) $headers[] = 'Authorization: ' . $_SERVER['HTTP_X_UPSTREAM_AUTHORIZATION'];
if (!empty($_SERVER['CONTENT_TYPE'])) $headers[] = 'Content-Type: ' . $_SERVER['CONTENT_TYPE'];
if (!empty($_SERVER['HTTP_ACCEPT_LANGUAGE'])) $headers[] = 'Accept-Language: ' . $_SERVER['HTTP_ACCEPT_LANGUAGE'];
if (!empty($_SERVER['HTTP_MCP_SESSION_ID'])) $headers[] = 'Mcp-Session-Id: ' . $_SERVER['HTTP_MCP_SESSION_ID'];
$ch = curl_init($target);
curl_setopt_array($ch, [CURLOPT_CUSTOMREQUEST=>$method, CURLOPT_HTTPHEADER=>$headers, CURLOPT_RETURNTRANSFER=>true,
  CURLOPT_HEADER=>true, CURLOPT_TIMEOUT=>60, CURLOPT_FOLLOWLOCATION=>false]);
if ($method === 'POST') curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
$resp = curl_exec($ch);
if ($resp === false) fail(502, 'upstream unreachable: ' . curl_error($ch));
$status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
$hsize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
foreach (explode("\r\n", substr($resp, 0, $hsize)) as $h) {
  if (preg_match('/^(content-type|mcp-session-id|content-disposition):/i', $h)) header($h);
}
http_response_code($status);
echo substr($resp, $hsize);
