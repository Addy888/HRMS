const fs = require('fs');
const path = require('path');
const mig = fs.readFileSync(path.join(__dirname, '..', 'prisma', 'migrations', '20260907081455_add_organization_to_company_policy', 'migration.sql'), 'utf8');
const dbschema = fs.readFileSync(path.join(__dirname, '..', 'dbschema_from_db.prisma'), 'utf8');

function extractCreateTables(sql){
  const re = /CREATE TABLE `([^`]*)`/g;
  const tables = new Set();
  let m;
  while((m = re.exec(sql))){
    tables.add(m[1]);
  }
  return Array.from(tables).sort();
}

function extractModels(prismaFile){
  const re = /^model\s+([A-Za-z0-9_]+)\s*{/gm;
  const models = new Set();
  let m;
  while((m = re.exec(prismaFile))){
    models.add(m[1]);
  }
  return Array.from(models).sort();
}

const createTables = extractCreateTables(mig);
const models = extractModels(dbschema);

const missing = createTables.filter(t => !models.includes(t));

console.log('CREATE TABLEs in migration:', createTables.length);
console.log('Models in DB introspection:', models.length);
console.log('Tables missing in DB (present in migration but NOT in introspected DB models):');
missing.forEach(t => console.log('-', t));

console.log('\nIntersection (tables present in both):');
createTables.filter(t => models.includes(t)).forEach(t => console.log('-', t));
