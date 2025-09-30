



node -e "require('dotenv').config(); const fn = require('./apiClient/eaches/overView').fetchOverview; (async ()=>{ try{ const r = await fn('IBM'); console.log('OK', Object.keys(r.overview||{}).slice(0,6)); }catch(e){ console.error('ERR', e && e.message); process.exitCode=2 } })()"