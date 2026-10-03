/* Catalog, prices and presets for the ground-floor editor.
   All prices are ILS incl. VAT, rough market ranges as of Oct 2026: [basic, mid, high]. */

const TIERS = ['b','m','h'];
const TIER_N = {b:'בסיסי', m:'בינוני', h:'גבוה'};
const TAG_N = {must:'חובה', nice:'רצוי', opt:'אם יישאר'};
const TOTAL_BUDGET = 300000;

/* default dimensions (estimated from photos) */
const DIMS = {
  OW:11.0,  OD:7.6,  H:2.7, DIND:2.2,
  KA:2.6,   KB:2.5,  ISL:2.16, ISW:1.18,
  HALLD:3.4, STW:1.0,
  MMDW:3.0, MMDD:2.8,
  SRVW:1.6, SRVD:1.9,
  BALW:9.0, BALD:4.2,
  DOORX:2.2, DOORW:2.4, DWINX:7.2, DWINW:1.8
};
const DIM_META = [
  ['OW','רוחב החלל הפתוח (מערב-מזרח)','מקיר הטלוויזיה עד קיר חלון המטבח'],
  ['OD','עומק החלל הפתוח (צפון-דרום)','מקיר המרפסת עד הקיר הקדמי של הסלון'],
  ['H','גובה תקרה',''],
  ['DIND','עומק פינת האוכל','מקיר המרפסת עד תחילת המטבח'],
  ['KA','אורך קיר חלון המטבח','מארון התנור עד דלת השירות'],
  ['KB','אורך קיר הכיור','בלי המקרר'],
  ['ISL','אורך האי',''],
  ['ISW','רוחב משטח האי','כולל בליטה לכיסאות בר'],
  ['HALLD','עומק המבואה','מקיר המטבח עד דלת הכניסה'],
  ['STW','רוחב המדרגות',''],
  ['MMDW','רוחב ק-ממד',''],
  ['MMDD','עומק ק-ממד',''],
  ['SRVW','רוחב ק-שירות',''],
  ['SRVD','עומק ק-שירות',''],
  ['BALW','אורך ק-מרפסת',''],
  ['BALD','עומק ק-מרפסת',''],
  ['DOORX','מרחק דלת המרפסת מקיר הטלוויזיה',''],
  ['DOORW','רוחב דלת המרפסת',''],
  ['DWINX','מרחק חלון פינת האוכל מקיר הטלוויזיה',''],
  ['DWINW','רוחב חלון פינת האוכל','']
];

/* ---------- surfaces ---------- */
const FLOORS = {
  keep:      {n:'ללא החלפה', mat:[0,0,0], inst:[0,0,0]},
  p60x120:   {n:'פורצלן 60×120 גוון אבן', mat:[120,180,280], inst:[220,320,450]},
  p80x80:    {n:'פורצלן 80×80 טראצו עדין', mat:[110,170,260], inst:[220,320,450]},
  p120:      {n:'פורצלן 120×120 מראה בטון', mat:[150,220,330], inst:[240,340,480]},
  wood:      {n:'פורצלן דמוי עץ 20×120', mat:[120,180,280], inst:[230,330,460]},
  spc:       {n:'SPC / למינציה דמוי עץ', mat:[90,140,220], inst:[60,90,130]},
  outdoor:   {n:'פורצלן חוץ 60×60 R11', mat:[100,160,240], inst:[220,320,450]}
};
const PAINT = [25,32,45]; /* per m² of wall + ceiling */
const WALL_COLORS = ['#F6F4EF','#F1EEE6','#ECE7DD','#E7E2D8','#DCE0D8','#E2E6E8','#EAE0D3','#D9D4CB'];

/* ---------- kitchen ---------- */
const FRONTS = {
  formica:{n:'פורמייקה', p:1300},
  polymer:{n:'פולימר', p:1800},
  veneer: {n:'פורניר עץ', p:2600},
  nano:   {n:'ננו / לכה מט', p:2900}
};
const FRONT_MULT = {b:.9, m:1, h:1.25};
const COUNTERS = {
  qWhite: {n:'קוורץ לבן עם עורק', c:'#F3F1EC', vein:1, p:[1100,1500,2000]},
  qGray:  {n:'קוורץ אפור בהיר', c:'#D9D7D2', vein:0, p:[1100,1500,2000]},
  pCal:   {n:'פורצלן קלקטה', c:'#F5F3EF', vein:2, p:[1300,1700,2300]},
  granite:{n:'גרניט', c:'#3B3A38', vein:0, speck:1, p:[1000,1400,1900]},
  concrete:{n:'אבן קיסר מראה בטון', c:'#B9B5AE', vein:0, cloud:1, p:[1400,1900,2600]},
  woodTop:{n:'משטח עץ אלון', c:'#C9A77C', vein:0, wood:1, p:[800,1200,1800]},
  oldBeige:{n:'שיש בז׳ קיים', c:'#E6DCC3', vein:0, p:[0,0,0]}
};
const HANDLES = {none:'בלי ידיות (חריץ)', black:'שחורות דקות', brass:'פליז', gold:'זהב מוברש', steel:'נירוסטה', long:'פס ארוך שחור'};
const FRONT_STYLES = {flat:'חלק', shaker:'מסגרת (שייקר)', fluted:'פסים אנכיים'};
const SPLASH = {ctr:'כמו המשטח', subway:'אריחי סאבווי', zellige:'אריחי זליג׳', paint:'צבע'};
const FINISHES = {fabric:'בד', boucle:'בוקלה', velvet:'קטיפה', leather:'עור', linen:'פשתן'};
const APPL = {
  oven:   {n:'תנור בנוי', p:[2500,4500,8000]},
  cooktop:{n:'כיריים גז 5 להבות', p:[1400,3000,6000]},
  dw:     {n:'מדיח כלים אינטגרלי', p:[2500,4000,6500]},
  hoodW:  {n:'קולט אדים לקיר', p:[1200,2500,5000]},
  hoodI:  {n:'קולט תקרה לאי', p:[3500,6500,11000]},
  faucet: {n:'ברז מטבח נשלף', p:[400,700,1500]},
  sink:   {n:'כיור מטבח', p:[500,900,1800]}
};
/* kitchen slots that can be linked to a real product: slot -> appliance price key(s) */
const APPL_SLOTS = [['oven','oven','תנור'],['cooktop','cooktop','כיריים'],['dw','dw','מדיח'],['hood',null,'קולט'],['faucet','faucet','ברז'],['sink','sink','כיור']];
const KITCHEN_WORK = {
  window: {n:'הגדלת חלון: ניסור, משקוף, מהנדס, חלון חדש', p:[6000,9000,14000]},
  gasSide:{n:'הזזת נקודת גז', p:[1000,1500,2000]},
  gasIsl: {n:'קו גז וחשמל לאי ברצפה', p:[2500,3500,5000]},
  install:{n:'התקנה וחיבורי אינסטלציה', p:[1500,2500,3500]},
  remove: {n:'פירוק ופינוי המטבח הישן', p:[800,1200,1800]}
};
const CAB_COLORS = ['#F1EEE8','#E6E1D8','#D9D2C7','#BFB4A3','#A3B096','#9DAB91','#7E8C7A','#8C9AA6','#59626B','#2E3034','oak','oak2','walnut'];

/* ---------- stairs / under-stairs / shutters / extras ---------- */
const CLAD = {
  keep:  {n:'אבן קיימת', p:[0,0,0]},
  oak:   {n:'מדרך אלון, רום לבן', p:[700,1000,1500]},
  porc:  {n:'פורצלן תואם לריצוף', p:[350,500,700]},
  micro: {n:'מיקרוטופינג', p:[450,650,900]}
};
const RAIL = {
  keep:  {n:'מעקה עץ קיים', p:[0,0,0]},
  black: {n:'מתכת שחורה דקה', p:[1200,1350,1600]},
  white: {n:'מתכת לבנה דקה', p:[1200,1350,1600]},
  glass: {n:'זכוכית עם מאחז דק', p:[2000,2500,3000]},
  woodm: {n:'מתכת + מאחז עץ', p:[1600,1800,2000]}
};
const LED_STEP = [180,280,450];
const UNDER = {
  open:   {n:'נישה פתוחה (מצב קיים)', p:[0,0,0]},
  shelves:{n:'סידור עם מדפים פתוחים', p:[500,900,1500]},
  cabinet:{n:'ארון נגרות סגור', p:[6000,10000,16000]},
  pantry: {n:'מזווה נשלף', p:[8000,12000,18000]},
  laundry:{n:'פינת גיהוץ ואחסון', p:[7000,11000,16000]}
};
const SHUTTERS = {
  kitchen:{n:'תריס חשמלי, חלון המטבח', p:[2000,2600,3500]},
  dining: {n:'תריס חשמלי, חלון פינת האוכל', p:[2200,3000,4000]},
  slider: {n:'תריס חשמלי, דלת המרפסת', p:[4000,5500,7500]}
};
const EXTRAS = {
  container:{n:'מכולה ופינוי פסולת', p:[2500,3500,5000]},
  protect:  {n:'הגנה על רצפות, רהיטים ומדרגות', p:[1000,1500,2500]},
  electric: {n:'חשמלאי: נקודות חדשות וספוטים', p:[4000,7000,12000]},
  plaster:  {n:'תיקוני טיח אחרי פירוק', p:[2000,3500,6000]},
  transport:{n:'הובלות והתקנות', p:[1000,2000,3000]}
};

/* ---------- furniture catalog ---------- */
const FAB = ['#ECE6DA','#DAD1C2','#C9BBA5','#B9A08A','#A3B096','#8E9A8C','#7A8796','#5E5A55'];
const WOODS = ['oak','oak2','walnut','#F1EEE8','#2B2A28'];
const CAT = {
  sofa3:   {n:'ספה תלת-מושבית', g:'סלון', p:[2500,5000,9000], w:2.4, d:.98, c:'#D8CFC0', pal:FAB, tag:'must', sz:[2.0,2.2,2.4,2.6,2.8]},
  sofaL:   {n:'ספה פינתית', g:'סלון', p:[4000,7500,13000], w:2.8, d:1.7, c:'#D8CFC0', pal:FAB, tag:'nice'},
  armchair:{n:'כורסה', g:'סלון', p:[1200,2500,4500], w:.85, d:.85, c:'#A3B096', pal:FAB.concat(['rattan']), tag:'nice'},
  recliner:{n:'כורסת טלוויזיה', g:'סלון', p:[2500,4500,8000], w:.95, d:.95, c:'#E3DCCF', pal:FAB, tag:'opt'},
  coffeeR: {n:'שולחן סלון עגול', g:'סלון', p:[500,1200,2800], w:.9, d:.9, c:'oak', pal:WOODS.concat(['#D9CDB8']), tag:'nice'},
  coffeeS: {n:'שולחן סלון מלבני', g:'סלון', p:[500,1200,2800], w:1.2, d:.6, c:'oak', pal:WOODS, tag:'nice'},
  rug:     {n:'שטיח', g:'סלון', p:[600,1500,3500], w:2.2, d:2.4, c:'#E2DACB', pal:['#E2DACB','#D5CBB6','#C7BBA6','#B7BDB0','#9AA39A','#8A8279'], tag:'nice', sz:[1.6,2.0,2.2,2.6,3.0]},
  tvUnit:  {n:'מזנון טלוויזיה צף', g:'סלון', p:[900,2200,5000], w:2.6, d:.42, c:'oak', pal:WOODS.concat(['#9DAB91']), tag:'must', sz:[1.8,2.2,2.6,3.0]},
  tvSlats: {n:'חיפוי עץ לקיר הטלוויזיה', g:'סלון', p:[1500,3000,5000], w:3.2, d:.03, c:'oak', pal:['oak','oak2','walnut','#A3B096'], tag:'opt', wall:1},
  tv:      {n:'טלוויזיה', g:'סלון', p:[2500,4500,8000], w:1.45, d:.06, c:'#111214', pal:['#111214'], tag:'opt', wall:1},
  sideboard:{n:'מזנון / קומודה', g:'סלון', p:[1200,2800,6000], w:1.6, d:.45, c:'oak', pal:WOODS.concat(['#9DAB91']), tag:'opt'},
  shelf:   {n:'ספרייה פתוחה', g:'סלון', p:[600,1500,3500], w:1.0, d:.35, c:'oak', pal:WOODS, tag:'opt'},
  floorLamp:{n:'מנורה עומדת', g:'סלון', p:[300,800,1800], w:.4, d:.4, c:'#2B2A28', pal:['#2B2A28','#C9A77C','#F1EEE8','#B8955A'], tag:'opt'},
  plant:   {n:'צמח בעציץ', g:'סלון', p:[150,400,900], w:.7, d:.66, c:'#B9714F', tag:'opt', model:{file:'DiffuseTransmissionPlant.json'}},
  vase:    {n:'אגרטל זכוכית עם פרחים', g:'סלון', p:[80,180,400], w:.22, d:.14, c:'#FFFFFF', tag:'opt', y:.76, model:{file:'GlassVaseFlowers.json'}},
  pouf:    {n:'פוף', g:'סלון', p:[300,500,1200], w:.55, d:.55, c:'#ECE6DA', pal:FAB, tag:'opt'},
  sofaVelvet:{n:'ספת קטיפה מעוצבת (דגם ריאליסטי)', g:'סלון', p:[4500,8000,14000], w:2.19, d:1.02, c:'#D9C7A9', tag:'nice', model:{file:'GlamVelvetSofa.json', variants:['Champagne','Gray','Pale Pink','Navy','Black'], chips:['#D9C7A9','#8D8D8A','#E3BFB8','#1F2E5A','#1E1E1E'], fixedSize:1}},
  chairAccent:{n:'כורסת קטיפה (דגם ריאליסטי)', g:'סלון', p:[900,1800,3500], w:.83, d:.57, c:'#E0782F', tag:'opt', model:{file:'SheenChair.json', variants:['Mango Velvet','Peacock Velvet'], chips:['#E0782F','#1F5E66'], fixedSize:1}},
  sconce:  {n:'מנורת קיר נחושת (דגם ריאליסטי)', g:'תאורה', p:[250,600,1400], w:.19, d:.23, c:'#B87333', tag:'opt', wall:1, y:1.75, model:{file:'AnisotropyBarnLamp.json', fixedSize:1}},
  tableR:  {n:'שולחן אוכל עגול 120', g:'פינת אוכל', p:[1500,3000,6000], w:1.2, d:1.2, c:'oak', pal:WOODS.concat(['#D9CDB8']), tag:'must'},
  tableS:  {n:'שולחן אוכל מלבני', g:'פינת אוכל', p:[1500,3200,6500], w:1.6, d:.9, c:'oak', pal:WOODS, tag:'must', sz:[1.4,1.6,1.8,2.0,2.2]},
  chair:   {n:'כיסא אוכל', g:'פינת אוכל', p:[250,550,1100], w:.46, d:.5, c:'#E8E2D6', pal:FAB.concat(['rattan','oak','#2B2A28']), tag:'must'},
  stool:   {n:'כיסא בר', g:'פינת אוכל', p:[300,650,1200], w:.42, d:.42, c:'#E8E2D6', pal:FAB.concat(['rattan','oak','#2B2A28']), tag:'must'},
  pRattan: {n:'מנורת ראטן', g:'תאורה', p:[350,800,1800], w:.48, d:.48, c:'#C29A68', pal:['#C29A68','#B07F50','#E8DCC4'], tag:'must', hang:1},
  pDrum:   {n:'מנורת בד עגולה', g:'תאורה', p:[300,750,1600], w:.64, d:.64, c:'#EEE8DC', pal:['#EEE8DC','#D9D2C6','#A3B096'], tag:'must', hang:1},
  pGlobe:  {n:'מנורת כדור אופל', g:'תאורה', p:[250,650,1500], w:.35, d:.35, c:'#F7F3EA', pal:['#F7F3EA'], tag:'must', hang:1},
  pLinear: {n:'מנורה לינארית', g:'תאורה', p:[600,1500,3500], w:1.4, d:.08, c:'oak', pal:['oak','#2B2A28','#F1EEE8'], tag:'must', hang:1},
  pGlass:  {n:'מנורת זכוכית', g:'תאורה', p:[200,450,900], w:.14, d:.14, c:'#FFFFFF', pal:['#FFFFFF'], tag:'opt', hang:1},
  console: {n:'ארון נעליים / קונסולה', g:'מבואה', p:[600,1400,3000], w:.9, d:.35, c:'oak', pal:WOODS.concat(['#9DAB91']), tag:'nice'},
  mirror:  {n:'מראה', g:'מבואה', p:[300,800,1800], w:.7, d:.03, c:'#2B2A28', pal:['#2B2A28','#B8955A','oak'], tag:'nice', wall:1},
  bench:   {n:'ספסל כניסה', g:'מבואה', p:[400,900,2000], w:1.0, d:.38, c:'oak', pal:WOODS, tag:'opt'},
  sofaBed: {n:'ספה נפתחת לאורחים', g:'ממ״ד', p:[2000,3500,6000], w:2.0, d:.95, c:'#B9A08A', pal:FAB, tag:'nice'},
  bed:     {n:'מיטה זוגית + מזרן', g:'ממ״ד', p:[2500,5000,9000], w:1.6, d:2.05, c:'#DAD1C2', pal:FAB, tag:'opt', sz:[.9,1.2,1.4,1.6]},
  wardrobe:{n:'ארון בגדים / אחסון', g:'ממ״ד', p:[1500,3500,7000], w:1.2, d:.6, c:'#F1EEE8', pal:WOODS.concat(['#E6E1D8']), tag:'nice', sz:[.8,1.2,1.6,2.0]},
  desk:    {n:'שולחן עבודה', g:'ממ״ד', p:[400,1000,2500], w:1.2, d:.6, c:'oak', pal:WOODS, tag:'opt'},
  deskChair:{n:'כיסא עבודה', g:'ממ״ד', p:[300,700,1500], w:.55, d:.55, c:'#5E5A55', pal:FAB, tag:'opt'},
  outTable:{n:'שולחן מרפסת גדול', g:'מרפסת', p:[2500,5000,9000], w:2.2, d:1.0, c:'teak', pal:['teak','oak','#F1EEE8','#2B2A28'], tag:'must', sz:[1.8,2.0,2.2,2.6]},
  outChair:{n:'כיסא מרפסת', g:'מרפסת', p:[200,450,900], w:.5, d:.55, c:'teak', pal:['teak','#F1EEE8','#2B2A28','rattan'], tag:'must'},
  outSofa: {n:'ספת מרפסת', g:'מרפסת', p:[2500,5000,9000], w:2.0, d:.85, c:'#E9E4DA', pal:FAB, tag:'nice'},
  dryRack: {n:'מתקן ייבוש כביסה', g:'מרפסת', p:[150,350,800], w:1.4, d:.55, c:'#F4F4F2', pal:['#F4F4F2','#9AA1A6'], tag:'opt'},
  planter: {n:'עציץ עץ זית', g:'מרפסת', p:[300,700,1500], w:.6, d:.6, c:'#D9D2C6', pal:['#D9D2C6','#2B2A28','#B9714F'], tag:'opt'},
  fridge:  {n:'מקרר נוסף', g:'מרפסת', p:[3500,6000,9000], w:.85, d:.7, c:'#F2F2F0', pal:['#F2F2F0','#232527','#B9BDC1'], tag:'opt'},
  washer:  {n:'מכונת כביסה', g:'שירות', p:[1800,2800,4500], w:.6, d:.6, c:'#F4F4F2', pal:['#F4F4F2','#2E3034'], tag:'opt'},
  laundryCab:{n:'ארון כביסה וחומרי ניקוי', g:'שירות', p:[3000,5000,8000], w:1.2, d:.6, c:'#F1EEE8', pal:WOODS.concat(['#9DAB91']), tag:'nice'},
  sShelf:  {n:'מדפים פתוחים', g:'שירות', p:[300,700,1500], w:.9, d:.35, c:'#F1EEE8', pal:WOODS, tag:'opt'}
};
/* default heights (m) used for resizing; wall items use their own */
const DEF_H = {sofa3:.82,sofaL:.82,armchair:.92,recliner:1.0,sofaBed:.84,outSofa:.78,coffeeR:.41,coffeeS:.4,tvUnit:.6,tvSlats:2.7,sideboard:.78,console:.8,shelf:1.9,floorLamp:1.7,plant:.84,vase:.2,pouf:.42,
  sofaVelvet:.79,chairAccent:.69,tableR:.775,tableS:.78,outTable:.78,desk:.78,chair:.86,outChair:1.02,stool:.86,deskChair:1.0,bench:.46,bed:1.1,wardrobe:2.2,dryRack:.95,planter:2.3,fridge:1.85,washer:.85,laundryCab:2.2,sShelf:1.85,rug:.012};
/* how a generic item's price scales when resized: area = w×h (wall cladding), floor = w×d, w = width (carpentry) */
const PSCALE = {tvSlats:'area',rug:'floor',wardrobe:'w',laundryCab:'w',tvUnit:'w',sideboard:'w',shelf:'w',sShelf:'w',console:'w'};
const FIN_MULT = {fabric:1,boucle:1.1,velvet:1.15,leather:1.4,linen:1.05};
const STYLE_MULT = {flat:1,shaker:1.15,fluted:1.25};
const THICK_MULT = {2:.9,4:1,6:1.25};
const SPLASH_P = {subway:[250,400,650],zellige:[450,700,1100]}; /* per m² incl. install */
const CTR_COLORS = ['#F5F3EF','#ECE7DD','#E2DCD0','#D9D7D2','#B9B5AE','#8E8A84','#5A5753','#3B3A38','#1F1F1F','#C9A77C'];
const SPLASH_COLORS = ['#F4F2EC','#ECE6DA','#DCE3DD','#A3B096','#7E8C7A','#C9D3DA','#7A8796','#2E3034','#B9714F'];
const UPHOL = ['sofa3','sofaL','armchair','recliner','sofaBed','outSofa','pouf','bed','deskChair','chair','stool'];
const CAT_GROUPS = ['סלון','פינת אוכל','תאורה','מבואה','ממ״ד','מרפסת','שירות'];
const PRODUCT_CATS = [['sofa3','ספה'],['sofaL','ספה פינתית'],['sofaBed','ספה נפתחת'],['armchair','כורסה'],['coffeeR','שולחן סלון עגול'],['coffeeS','שולחן סלון מלבני'],['rug','שטיח'],['tvUnit','מזנון טלוויזיה'],['pouf','פוף'],['tableR','שולחן אוכל עגול'],['tableS','שולחן אוכל מלבני'],['chair','כיסא אוכל'],['stool','כיסא בר'],['pRattan','מנורת תלייה ראטן/במבוק'],['pDrum','מנורת תלייה בד'],['pGlobe','מנורת תלייה זכוכית'],['floorLamp','מנורה עומדת'],['console','ארון נעליים / קונסולה'],['mirror','מראה'],['wardrobe','ארון'],['desk','שולחן עבודה'],['outTable','שולחן מרפסת'],['outChair','כיסא מרפסת'],['outSofa','ספת מרפסת'],['sideboard','מזנון / קומודה'],['shelf','ספרייה'],['appl:oven','תנור'],['appl:cooktop','כיריים'],['appl:dw','מדיח'],['appl:hood','קולט'],['appl:faucet','ברז מטבח'],['appl:sink','כיור']];

/* ---------- presets ---------- */
function plan0(d){ /* the anchors presets need; mirrors app plan() */
  const DI=d.DIND||0, kwZ=DI+d.KA+1.6, fridgeX0=d.OW-0.6-d.KB-0.75, hx0=fridgeX0-0.15, hz0=kwZ+0.2, hz1=hz0+d.HALLD;
  const isX1=d.OW-0.6-1.1, isX0=isX1-d.ISW, isZc=DI+(0.6+d.KA)/2+0.2;
  const mx1=hx0-0.2, mx0=mx1-d.MMDW, mz0=d.OD+0.2, mz1=mz0+d.MMDD;
  const bx0=0.5, bx1=0.5+d.BALW, bz1=-0.2, bz0=bz1-d.BALD;
  const sx0=d.OW+0.2, sx1=sx0+d.SRVW, sz0=DI+d.KA-0.3, sz1=sz0+d.SRVD;
  return {DI,dineX:d.OW-3.0,dineZ:Math.max(.9,DI*.55),kwZ,hx0,hz0,hz1,isX0,isX1,isZc,mx0,mx1,mz0,mz1,bx0,bx1,bz0,bz1,sx0,sx1,sz0,sz1};
}
let _id=0; const nid=()=> 'i'+(++_id)+Math.random().toString(36).slice(2,6);
const face=(x,z,tx,tz)=>Math.atan2(-(tx-x),-(tz-z));
function it(type,x,z,rot,extra){ return Object.assign({id:nid(),type,x:+x.toFixed(3),z:+z.toFixed(3),rot:+(rot||0).toFixed(4)},extra||{}); }

function furnishNew(d,o){
  const p=plan0(d), L=[], K=k=>(o.link&&o.link[k])?{pid:o.link[k]}:{};
  L.push(it('tv',.04,3.2,-Math.PI/2,{ex:1}));
  L.push(it('tvUnit',.22,3.2,-Math.PI/2,Object.assign({c:o.wood},K('tvUnit'))));
  if(o.slats) L.push(it('tvSlats',.016,3.2,-Math.PI/2,{c:o.wood}));
  L.push(it('sofa3',4.1,3.2,Math.PI/2,Object.assign({c:o.sofa},K('sofa'))));
  L.push(it('armchair',2.0,5.35,face(2.0,5.35,0.8,3.0),Object.assign({c:o.arm},K('armchair'))));
  L.push(it('rug',2.35,3.2,0,Object.assign({c:o.rug},K('rug'))));
  L.push(it(o.coffee||'coffeeR',2.45,3.2,0,Object.assign({c:o.coffeeC||o.wood},K('coffee'))));
  L.push(it('plant',1.0,.75,0));
  L.push(it('vase',2.45,3.2,0,{y:.4}));
  const tx=p.dineX,tz=p.dineZ;
  if(o.table==='tableS'){ L.push(it('tableS',tx,tz,0,{c:o.tableC||o.wood}));
    [[tx-.4,tz-.75],[tx+.4,tz-.75],[tx-.4,tz+.75],[tx+.4,tz+.75]].forEach(([a,b])=>L.push(it('chair',a,b,face(a,b,a,tz),{c:o.chair})));
  } else { L.push(it('tableR',tx,tz,0,Object.assign({c:o.tableC||o.wood},K('table'))));
    [[0,-.82],[.82,0],[0,.82],[-.82,0]].forEach(([a,b])=>L.push(it('chair',tx+a,tz+b,face(tx+a,tz+b,tx,tz),Object.assign({c:o.chair},K('chair')))));
  }
  L.push(it(o.dinePend,tx,tz,0,K('dinePend')));
  L.push(it('vase',tx+.12,tz-.05,0,{y:.775}));
  const sx=p.isX0-0.33, zc=p.isZc;
  [-.6,0,.6].forEach(dz=>L.push(it('stool',sx,zc+dz,-Math.PI/2,Object.assign({c:o.stool},K('stool')))));
  const ix=(p.isX0+p.isX1)/2;
  if(o.islPend) (o.islPend==='pRattan'&&o.islN===2?[-.38,.38]:[-.6,0,.6]).forEach(dz=>L.push(it(o.islPend,ix,zc+dz,0,K('islPend'))));
  /* hall */
  L.push(it('console',p.hx0+2.55,p.hz1-.18,0,Object.assign({c:o.wood},K('console'))));
  L.push(it('mirror',p.hx0+2.55,p.hz1-.016,0,K('mirror')));
  L.push(it('sconce',p.hx0+.02,p.hz0+.9,-Math.PI/2));
  /* mamad */
  const mxc=(p.mx0+p.mx1)/2, mzc=(p.mz0+p.mz1)/2;
  L.push(it('sofaBed',p.mx0+.55,mzc,-Math.PI/2,Object.assign({c:o.mamadSofa||'#B9A08A'},K('sofaBed'))));
  L.push(it('wardrobe',p.mx1-.65,p.mz0+.31,Math.PI,{c:'#F1EEE8'}));
  L.push(it('desk',mxc+.3,p.mz1-.31,0,{c:o.wood}));
  L.push(it('deskChair',mxc+.3,p.mz1-.85,Math.PI));
  /* service */
  L.push(it('washer',p.sx1-.32,p.sz1-.32,-Math.PI/2,{ex:1}));
  L.push(it('laundryCab',p.sx0+.75,p.sz0+.31,Math.PI,{w:1.2}));
  /* balcony */
  const bt=2.6, bzc=(p.bz0+p.bz1)/2;
  L.push(it('outTable',bt,bzc,Math.PI/2,{c:o.outWood||'teak'}));
  [[-.8,-.7],[0,-.7],[.8,-.7],[-.8,.7],[0,.7],[.8,.7]].forEach(([a,b])=>{const x=bt+b,z=bzc+a;L.push(it('outChair',x,z,face(x,z,bt,z),Object.assign({c:o.outWood||'teak'},K('outChair'))));});
  L.push(it('outChair',bt,bzc-1.35,0,{c:o.outWood||'teak'})); L.push(it('outChair',bt,bzc+1.35,Math.PI,{c:o.outWood||'teak'}));
  L.push(it('outSofa',6.0,p.bz0+.5,Math.PI,Object.assign({c:'#E9E4DA'},K('outSofa'))));
  L.push(it('fridge',p.bx1-.45,p.bz0+.45,Math.PI/2,{ex:1}));
  L.push(it('tv',p.bx1-.04,bzc+.6,Math.PI/2,{ex:1}));
  L.push(it('dryRack',p.bx1-1.6,p.bz1-.5,0));
  L.push(it('planter',p.bx0+.5,p.bz0+.5,0));
  return L;
}
function furnishNow(d){
  const p=plan0(d), L=[], ex={ex:1};
  L.push(it('tv',.04,3.2,-Math.PI/2,ex));
  L.push(it('tvUnit',.25,3.0,-Math.PI/2,{ex:1,c:'#3A2119',w:3.0}));
  L.push(it('sofa3',4.1,3.2,Math.PI/2,{ex:1,c:'#3E2A22',w:2.3}));
  L.push(it('sofa3',2.6,1.2,Math.PI,{ex:1,c:'#3E2A22',w:2.0}));
  L.push(it('recliner',1.2,5.2,.35,{ex:1,c:'#E3DCCF'}));
  L.push(it('coffeeS',2.55,3.2,Math.PI/2,{ex:1,c:'#3A2119'}));
  const tx=p.dineX-.4,tz=p.dineZ;
  L.push(it('tableS',tx,tz,0,{ex:1,c:'#3A2119',w:2.2,d:1.0}));
  [tx-.7,tx,tx+.7].forEach(x=>{L.push(it('chair',x,tz-.85,0,{ex:1,c:'#2E1B14'}));L.push(it('chair',x,tz+.85,Math.PI,{ex:1,c:'#2E1B14'}));});
  L.push(it('chair',tx-1.45,tz,-Math.PI/2,{ex:1,c:'#2E1B14'})); L.push(it('chair',tx+1.45,tz,Math.PI/2,{ex:1,c:'#2E1B14'}));
  [tx-.5,tx,tx+.5].forEach(x=>L.push(it('pGlass',x,tz,0,ex)));
  const sx=p.isX0-0.33; [p.isZc-.35,p.isZc+.35].forEach(z=>L.push(it('stool',sx,z,-Math.PI/2,{ex:1,c:'#E8E1D3'})));
  const ix=(p.isX0+p.isX1)/2; [-.75,-.25,.25,.75].forEach(dz=>L.push(it('pGlass',ix,p.isZc+dz,0,ex)));
  const mzc=(p.mz0+p.mz1)/2;
  L.push(it('bed',p.mx0+1.1,mzc,-Math.PI/2,{ex:1,c:'#F2F0EC',w:1.4}));
  L.push(it('wardrobe',p.mx1-.65,p.mz0+.31,Math.PI,{ex:1,c:'#E6E1D8'}));
  L.push(it('washer',p.sx1-.32,p.sz1-.32,-Math.PI/2,ex));
  const bt=2.6, bzc=(p.bz0+p.bz1)/2;
  L.push(it('outTable',bt,bzc,Math.PI/2,{ex:1,c:'teak',w:1.8}));
  [[-.6,-.7],[.6,-.7],[-.6,.7],[.6,.7]].forEach(([a,b])=>{const x=bt+b,z=bzc+a;L.push(it('outChair',x,z,face(x,z,bt,z),{ex:1,c:'teak'}));});
  L.push(it('outSofa',6.2,p.bz0+.5,Math.PI,{ex:1,c:'#F2EFE8'}));
  L.push(it('fridge',p.bx1-.45,p.bz0+.45,Math.PI/2,ex));
  L.push(it('tv',p.bx1-.04,bzc+.6,Math.PI/2,ex));
  L.push(it('dryRack',4.6,p.bz1-.7,0,ex)); L.push(it('dryRack',4.6,p.bz1-1.6,0,ex));
  return L;
}
const roomsNew=(floor,wall,mamadFloor)=>({
  open:{floor, wall, paint:1}, hall:{floor, wall, paint:1}, mamad:{floor:mamadFloor||floor, wall, paint:1},
  service:{floor, wall, paint:1}, balcony:{floor:'keep', wall:'#F2EFE8', paint:0, ftag:'opt'}
});
function preset(key, d){
  d = Object.assign({}, DIMS, d||{});
  const base = {v:1, tier:'m', reservePct:12, filter:'nice', dims:d,
    shutters:{kitchen:1,dining:1,slider:1},
    extras:{container:1,protect:1,electric:1,plaster:1,transport:1}};
  if(key==='now') return Object.assign(base,{name:'המצב היום',
    kitchen:{applP:{}, keep:1, fronts:'veneer', base:'#4B2A1F', upper:'#4B2A1F', tower:'#4B2A1F', island:'#3A2119', counter:'oldBeige', handle:'steel', cook:'under', winW:1.0, appl:{}},
    rooms:{open:{floor:'keep',wall:'#F1F0EA',paint:0},hall:{floor:'keep',wall:'#F1F0EA',paint:0},mamad:{floor:'keep',wall:'#F3F3F1',paint:0},service:{floor:'keep',wall:'#F1F0EA',paint:0},balcony:{floor:'keep',wall:'#F2EFE8',paint:0}},
    stairs:{clad:'keep',rail:'keep',led:0}, under:{sol:'open',c:'#F1EEE8'},
    shutters:{kitchen:0,dining:0,slider:0}, extras:{container:0,protect:0,electric:0,plaster:0,transport:0},
    items:furnishNow(d)});
  if(key==='a') return Object.assign(base,{name:'א׳ לבן חם ועץ',
    kitchen:{applP:{}, fronts:'veneer', base:'#F1EEE8', upper:'#F1EEE8', tower:'oak', island:'oak', counter:'qWhite', handle:'none', cook:'island', winW:2.3, appl:{}},
    rooms:roomsNew('p60x120','#F6F4EF'), stairs:{clad:'oak',rail:'glass',led:1}, under:{sol:'cabinet',c:'#F1EEE8'},
    items:furnishNew(d,{wood:'oak',slats:1,sofa:'#DAD1C2',arm:'#CBBDA6',rug:'#E0D8C9',chair:'#E8E2D6',stool:'#E8E2D6',dinePend:'pDrum',islPend:null})});
  if(key==='c') return Object.assign(base,{name:'ג׳ ירוק מרווה טבעי',
    kitchen:{applP:{}, fronts:'polymer', base:'#A3B096', upper:'#F5F2EB', tower:'#A3B096', island:'oak2', counter:'qWhite', handle:'brass', cook:'side', winW:1.55, appl:{}},
    rooms:roomsNew('p80x80','#F5F2EB'), stairs:{clad:'porc',rail:'black',led:1}, under:{sol:'pantry',c:'#A3B096'},
    items:furnishNew(d,{wood:'oak2',sofa:'#ECE6DA',arm:'rattan',rug:'#D5CBB6',coffeeC:'#D9CDB8',chair:'rattan',stool:'rattan',table:'tableS',dinePend:'pRattan',islPend:'pRattan',islN:3})});
  return Object.assign(base,{name:'השילוב שלי',
    kitchen:{fronts:'polymer', base:'#F1EEE8', upper:'#F1EEE8', tower:'oak', island:'#9DAB91', counter:'qWhite', handle:'black', cook:'side', winW:1.55, appl:{}, applP:{oven:'ap-bosch-hba374bb1',cooktop:'ap-delonghi-ndg105x',dw:'ap-electrolux-eeq47200l',hood:'ap-elica-shire-wh90',faucet:'ap-hamat-304469'}},
    rooms:roomsNew('p60x120','#F6F4EF'), stairs:{clad:'oak',rail:'black',led:1}, under:{sol:'laundry',c:'#F1EEE8'},
    items:furnishNew(d,{wood:'oak',sofa:'#D8CFC0',arm:'#A3B096',rug:'#E2DACB',chair:'#E8E2D6',stool:'#E8E2D6',dinePend:'pDrum',islPend:'pRattan',islN:2,
      link:{sofa:'ik-kivik-3',armchair:'ik-dyvlinge',rug:'ik-lohals-200',coffee:'ik-borgeby',tvUnit:'ik-stockholm25-tv',table:'ik-skogsta-120',chair:'ik-tonstad-chair',stool:'ik-skogsta-stool',islPend:'ik-narrkolv',dinePend:'ik-stockholm25-textile',console:'ik-stall-4',mirror:'ik-lindbyn-80',sofaBed:'ik-alvdalen',outChair:'ik-nammaro-chair',outSofa:'ik-nammaro-sofa3'}})});
}

export {TIERS,TIER_N,TAG_N,TOTAL_BUDGET,DIMS,DIM_META,FLOORS,PAINT,WALL_COLORS,FRONTS,FRONT_MULT,COUNTERS,HANDLES,APPL,KITCHEN_WORK,CAB_COLORS,
  CLAD,RAIL,LED_STEP,UNDER,SHUTTERS,EXTRAS,CAT,CAT_GROUPS,preset,nid,plan0,APPL_SLOTS,PRODUCT_CATS,FRONT_STYLES,SPLASH,FINISHES,DEF_H,UPHOL,PSCALE,FIN_MULT,STYLE_MULT,THICK_MULT,SPLASH_P,CTR_COLORS,SPLASH_COLORS};
