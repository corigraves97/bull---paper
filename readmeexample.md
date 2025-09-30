



node -e "require('dotenv').config(); const fn = require('./apiClient/eaches/overView').fetchOverview; (async ()=>{ try{ const r = await fn('IBM'); console.log('OK', Object.keys(r.overview||{}).slice(0,6)); }catch(e){ console.error('ERR', e && e.message); process.exitCode=2 } })()"


When to use a curl test
Verify an endpoint is reachable (server up / DNS / firewall).
Check HTTP status, headers, and response body.
Validate authentication (Bearer, Basic, API key) and content negotiation.
Reproduce API calls you plan to make from code.
Add simple checks in CI scripts or local health checks.


Useful curl flags (cheat sheet)
-X METHOD — set HTTP method (GET, POST, PUT, DELETE). Often unnecessary for GET.
-H 'Header: v' — add a header (Content-Type, Authorization).
-d / --data — send request body (implies POST unless -X used).
-F — multipart form (file upload): -F 'file=@/path/to/file'
-i — include response headers in output
-I — fetch headers only (HEAD request-like)
-s / -S — silent / show errors (use together: -sS)
-f / --fail — exit non-zero on HTTP 4xx/5xx (good for scripts)
-L — follow redirects
-o FILE — write body to FILE (prevents huge output)
-w FORMAT — write a format string after completion (e.g., '%{http_code} %{time_total}\n')
--max-time NUM — set overall timeout (seconds)
-v or --trace-ascii path — verbose/tracing for debugging
--compressed — accept compressed responses
--header 'Accept: application/json' — request JSON
--remote-name (-O) — save response using remote filename

Simple GET (show headers + body)
curl -i "http://localhost:3000/api/overview?symbol=IBM"

GET JSON and pretty-print
curl -sS "https://www.alphavantage.co/query?function=OVERVIEW&symbol=IBM&apikey=$ALPHAVANTAGE_KEY" -H "Accept: application/json" | jq .


Fail on HTTP error and show only body (good for scripts)
curl -sS --fail "https://api.example.com/health" -o /dev/stdout

Get just the HTTP status code
curl -s -o /dev/null -w "%{http_code}\n" "https://example.com/path"

POST JSON
curl -sS -X POST "http://localhost:3000/api/resource" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"alice","age":30}' | jq .

POST form-data (file upload)
curl -sS -F "file=@/path/to/file.csv" -F "meta=notes" "https://example.com/upload"

Save response to file (download)
curl -L -o data.json "https://example.com/export.json"

Show timing and status for a quick health check
curl -sS -o /dev/null -w "HTTP %{http_code} in %{time_total}s\n" "http://localhost:3000/health"

Alpha Vantage tip (relevant to your project)
curl -sS "https://www.alphavantage.co/query?function=OVERVIEW&symbol=IBM&apikey=$ALPHAVANTAGE_KEY" \
  -H "Accept: application/json" | jq '.Note // .'

Alpha Vantage will often return a JSON with a "Note" field when you are rate-limited. Always check for that in automated checks:


If you see a Note like "Thank you for using Alpha Vantage...please visit ...", you were rate-limited.

