import {cp,rm,mkdir} from 'node:fs/promises';
const root=new URL('../',import.meta.url);await rm(new URL('dist/',root),{recursive:true,force:true});await mkdir(new URL('dist/',root));await cp(new URL('public/',root),new URL('dist/',root),{recursive:true});console.log('Static site copied to dist/. No deployment performed.');
