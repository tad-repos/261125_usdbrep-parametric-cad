import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const root=process.cwd(), out=path.join(root,'build');
const {version}=JSON.parse(fs.readFileSync('package.json','utf8'));
const commit=process.env.GITHUB_SHA||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const htmlPath=path.join(out,'index.html');
const html=fs.readFileSync(htmlPath,'utf8');
if(!html.includes('__RELEASE_LABEL__'))throw new Error('Missing release label');
fs.writeFileSync(htmlPath,html.replace('__RELEASE_LABEL__','v'+version+' · '+commit.slice(0,7)).replace('__RELEASE_SHA__',commit));
fs.writeFileSync(path.join(out,'release.json'),JSON.stringify({version,commit})+'\n');
fs.writeFileSync(path.join(out,'.nojekyll'),'');
const licenses=path.join(out,'licenses');fs.mkdirSync(licenses,{recursive:true});fs.copyFileSync('LICENSE',path.join(licenses,'LICENSE'));
const deps=execFileSync('npm',['ls','--omit=dev','--all','--parseable'],{encoding:'utf8',maxBuffer:8*1024*1024}).trim().split(/\r?\n/);
const inventory=[];
function collect(from,to){for(const e of fs.readdirSync(from,{withFileTypes:true})){if(e.name==='node_modules'||e.name.startsWith('.'))continue;const s=path.join(from,e.name),d=path.join(to,e.name);if(e.isDirectory())collect(s,d);else if(e.isFile()&&/^(licen[cs]e|notice|copying|copyright|ofl|third[-_ ]?party|authors|attribution)/i.test(e.name)){fs.mkdirSync(path.dirname(d),{recursive:true});fs.copyFileSync(s,d);}}}
for(const dir of new Set(deps)){if(path.resolve(dir)===root||!fs.existsSync(path.join(dir,'package.json')))continue;const dep=JSON.parse(fs.readFileSync(path.join(dir,'package.json'),'utf8'));inventory.push(dep.name+' '+dep.version+' — '+(typeof dep.license==='string'?dep.license:JSON.stringify(dep.license||'unspecified')));collect(dir,path.join(licenses,dep.name.replace(/[^a-zA-Z0-9_.-]/g,'_')+'-'+dep.version));}
fs.writeFileSync(path.join(licenses,'index.txt'),'Original application: MIT. Libraries retain their licenses.\n\n'+inventory.sort().join('\n')+'\n');
