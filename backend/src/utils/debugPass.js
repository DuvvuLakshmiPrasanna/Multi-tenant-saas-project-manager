const bcrypt = require('bcrypt');
const hash = '$2b$10$mkHiJAUKQYK4PpPLJLvPK.nnKLEj98w/2qP1PBt3zzRaTomv3/eLm';
const pass = 'Admin@123';

console.log('Testing Hash:', hash);
console.log('Testing Pass:', pass);

bcrypt.compare(pass, hash).then(res => {
    console.log('Match Existing:', res);
});

const newHash = bcrypt.hashSync(pass, 10);
console.log('New Hash:', newHash);
bcrypt.compare(pass, newHash).then(res => {
    console.log('Match New:', res);
});
