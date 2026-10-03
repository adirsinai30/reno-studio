# סטודיו בית ההורים

הדמיית תלת-ממד של קומת הקרקע בבית ההורים, עם עריכת עיצוב, מוצרים אמיתיים, צילום ריאליסטי ותקציב חי.
אתר סטטי: אין שרת ואין מסד נתונים. כל משתמש שומר בדפדפן שלו, ומשתפים עיצוב בקישור.

## הרצה במחשב

דרישות: Node.js 20 ומעלה, Git.

```bash
cd ~/Desktop/reno-studio
npm install
npm run dev
```

הדפדפן נפתח על `http://localhost:5180`. כל שינוי בקוד מתעדכן מיד בדפדפן.

## העלאה ל-GitHub

```bash
git init
git add .
git commit -m "סטודיו בית ההורים: גרסה ראשונה"
gh repo create reno-studio --private --source=. --push
```

בלי `gh`: יוצרים ריפו ריק ב-github.com ומריצים את שתי הפקודות שהאתר מציג (`git remote add origin ...` ו-`git push -u origin main`).

## העלאה לאוויר ב-Vercel

1. ב-vercel.com: **Add New → Project** ובוחרים את הריפו `reno-studio`.
2. Vercel מזהה Vite לבד. לא משנים הגדרות ולוחצים **Deploy**.
3. מקבלים כתובת כמו `reno-studio.vercel.app`. זה הקישור לשלוח לאנשים.

מעכשיו כל `git push` ל-main מעלה גרסה חדשה לבד.
הריפו יכול להיות פרטי, אבל האתר עצמו פתוח לכל מי שיש לו את הכתובת.

## איך משתפים עיצוב

- כפתור **שיתוף** למעלה מעתיק קישור שכל העיצוב מקודד בתוכו. בטלפון נפתח תפריט השיתוף.
- מי שפותח את הקישור מקבל עותק משלו. השינויים שלו לא משפיעים על שלך.
- תמונות שמעלים מהדפדפן לא עוברות בקישור. תמונות שנמצאות בריפו (`public/products`) רואים כולם.

## מבנה

| נתיב | מה יש שם |
|---|---|
| `index.html` | המעטפת והעיצוב (CSS) |
| `src/app.js` | מצב, לוחות עריכה, תקציב, גרסאות, שיתוף |
| `src/engine.js` | תלת-ממד: מבנה הבית, מטבח, רהיטים, צילום ריאליסטי |
| `src/data.js` | קטלוג, מחירים, מידות ברירת מחדל ונקודות התחלה |
| `src/local.js` | שמירה מקומית: מוצרים, גרסאות ותמונות |
| `src/share.js` | קידוד העיצוב לקישור |
| `public/products.json` | ספריית המוצרים המשותפת |
| `public/products/` | תמונות מוצרים משותפות |
| `public/models/` | דגמים ריאליסטיים (glTF) |

## קרדיטים

דגמים: Khronos glTF Sample Assets. GlamVelvetSofa ו-SheenChair מאת Eric Chadwick עבור Wayfair (CC BY 4.0 / CC0). DiffuseTransmissionPlant ו-AnisotropyBarnLamp מאת Eric Chadwick (CC BY 4.0). GlassVaseFlowers (CC0). צילום ריאליסטי: three-gpu-pathtracer.
