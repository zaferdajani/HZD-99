const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
module.exports = function validateComics(root = path.join(__dirname, '..')) {
  const text = fs.readFileSync(path.join(root,'assets/manhua/chapters.json'),'utf8');
  if(text.length>1000000)throw Error('Comic manifest exceeds the runtime update limit of 1,000,000 characters');
  const manifest = JSON.parse(text);
  const context = vm.createContext({console});
  vm.runInContext(fs.readFileSync(path.join(root,'js/comics.js'),'utf8')+'\nthis.validate = ComicRewards.validate;',context);
  context.validate(manifest);
  for (const ch of manifest.chapters) for (const slide of ch.slides) {
    const file = path.join(root, slide.src);
    if (!fs.existsSync(file) || !fs.statSync(file).isFile() || fs.statSync(file).size < 32)
      throw Error('Missing comic page: '+slide.src);
    if (fs.lstatSync(file).isSymbolicLink()) throw Error('Comic page cannot be a symlink: '+slide.src);
  }
  return manifest;
};
if (require.main === module) {
  const data = module.exports();
  console.log('PASS comic manifest:', data.chapters.length, 'chapters;',data.chapters.reduce((n,c)=>n+c.slides.length,0),'image references');
}
