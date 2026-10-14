import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,relative,isAbsolute} from 'node:path';
const root=resolve(process.argv.includes('--dist')?'dist':'.');
const port=Number(process.env.PORT||4173),host='127.0.0.1';
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2','.otf':'font/otf'};
const server=http.createServer(async(req,res)=>{
  try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));const rel=relative(root,file);if(rel.startsWith('..')||isAbsolute(rel)||rel.split(/[\\/]/).some(p=>p.startsWith('.'))){res.writeHead(403).end();return;}
    if(!(await stat(file)).isFile()){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(await readFile(file));
  }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'}).end('Not found');}
});
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`Port ${port} is busy. Set PORT to another port.`:error.message);process.exitCode=1;});
server.listen(port,host,()=>console.log(`STICK SOMETHING · http://${host}:${port}`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
