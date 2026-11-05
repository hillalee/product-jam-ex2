import { useState } from "react";
import styles from "./DesignPage.module.css";

const TEAM = [
  {
    role: "עיצוב אפליקציה",
    names: "אביב כהן וגדיר סלמאן",
    work: "שפה חזותית, טיפוגרפיה, צבעוניות ועיצוב מסכים",
  },
  {
    role: "מפתחות האפליקציה",
    names: "הנאא מצארוה ונועה חבה",
    work: "חשיבה טכנולוגית, הגדרת הפונקציונליות ובחינת היתכנות הפיתוח.",
  },
];

const BACKGROUND = [
  {
    title: "רקע ומוטיבציה",
    text: "חתולי רחוב הם חלק מהסביבה שלנו, ולא פעם אנחנו נתקלים בחתולים שזקוקים לאוכל, מים או טיפול רפואי.",
  },
  {
    title: "הבעיה והצורך",
    text: "אנשים רבים אוהבים חתולים ורוצים לעזור להם, אך לא תמיד יש להם את הזמן או האפשרות לאמץ חתול ולהתחייב לטיפול קבוע. גם מי שרוצה לעזור באופן חד-פעמי לא תמיד יודע איזה חתול זקוק לעזרה ואיך אפשר לסייע לו.",
  },
  {
    title: "הפתרון שלנו",
    text: "המטרה של CAT-CH היא ליצור קהילה שכונתית שתאפשר לתושבים לשתף פעולה בטיפול בחתולי הרחוב.",
  },
  {
    title: "איך זה עובד?",
    text: "באמצעות האפליקציה ניתן יהיה לעקוב אחר מצב החתולים, לראות אילו משימות נדרשות ולבחור כיצד ומתי לעזור.",
  },
  {
    title: "ההשפעה",
    text: "כך גם אנשים שלא יכולים להתחייב לטיפול קבוע יוכלו לקחת חלק, לתרום לפי היכולת שלהם ולעזור ליותר חתולים לקבל את הטיפול שהם צריכים.",
  },
];

const AUDIENCE = ["אנשים שרוצים לעזור", "תושבי השכונה", "מאכילי חתולים"];

const MENU_LINKS = [
  { href: "#team", label: "הצוות" },
  { href: "#background", label: "רקע ומטרות" },
  { href: "#audience", label: "קהל היעד" },
  { href: "#building", label: "מה אנחנו בונים" },
];

const PHOTOS = [
  "/design/eat.jpg",
  "/design/two-cats.jpg",
  "/design/pcat.jpg",
  "/design/girl.jpg",
];

export default function DesignPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <main className={styles.page} lang="he" dir="rtl">
      <div className={styles.menuBar}>
        <button
          type="button"
          className={styles.menuButton}
          aria-label="תפריט"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          ☰
        </button>
        <span lang="en">Cat-ch</span>
      </div>

      <nav
        className={isMenuOpen ? styles.menuOpen : styles.menu}
        onClick={() => setIsMenuOpen(false)}
      >
        {MENU_LINKS.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>

      <div className={styles.content}>
        <section className={`${styles.section} ${styles.hero}`}>
          <h1 className={styles.heroTitle}>
            <span lang="en">Cat-ch</span> היא אפליקציית טינדר לחתולי רחוב
          </h1>
          <p>
            כל כרטיס הוא חתול מהשכונה שלך ורשימת משימות שהוא עדיין צריך שיעשו
            בשבילו היום. מחליקים ימינה כדי לקחת את המשימה, או שמאלה כדי להעביר
            אותה לשכן אחר. ככה כל השכונה מטפלת יחד בחתולים שלה באופן מסודר
            ועקבי.
          </p>
          <a
            className={`${styles.pillButton} ${styles.filled}`}
            href="#background"
          >
            למידע נוסף
          </a>
        </section>

        <section id="team" className={styles.section}>
          <h2 className={styles.sectionTitle}>
            צוות הפרויקט מתבצע בשיתוף פעולה של כל חברות הצוות:
          </h2>
          <div className={styles.team}>
            {TEAM.map((member) => (
              <div key={member.role} className={styles.member}>
                <p className={styles.role}>{member.role}</p>
                <p className={styles.itemTitle}>{member.names}</p>
                <p className={styles.smallText}>{member.work}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="background" className={styles.section}>
          <h2 className={styles.sectionTitle}>רקע, מניעים ומטרות</h2>
          {BACKGROUND.map((item) => (
            <div key={item.title} className={styles.backgroundItem}>
              <p className={styles.itemTitle}>{item.title}</p>
              <p className={styles.smallText}>{item.text}</p>
            </div>
          ))}
        </section>

        <section id="audience" className={styles.section}>
          <h2 className={styles.sectionTitle}>קהל היעד וקונטקסט השימוש</h2>
          <div className={styles.card}>
            <ul className={styles.audience}>
              {AUDIENCE.map((group) => (
                <li key={group} className={styles.itemTitle}>
                  {group} &gt;
                </li>
              ))}
            </ul>
            <button type="button" className={styles.pillButton}>
              להצטרף &gt;
            </button>
          </div>
          <div className={styles.card}>
            <p className={styles.itemTitle}>
              האפליקציה מיועדת לאנשים שרוצים לעזור לחתולי הרחוב בשכונה שלהם, גם
              אם אין להם זמן לטפל בהם באופן קבוע.
            </p>
            <p className={styles.smallText}>
              היא מתאימה גם לאנשים שכבר מאכילים חתולים ורוצים להיעזר בשכנים
              נוספים. השימוש באפליקציה יהיה בעיקר דרך הטלפון, בבית או תוך כדי
              הליכה בשכונה. המשתמשים יוכלו לראות אילו חתולים צריכים עזרה, לקבל
              התראות על חתולים בקרבתם ולבחור משימה לפי הזמן והיכולת שלהם. חשוב
              שהממשק יהיה פשוט, ברור ונוח לשימוש גם מחוץ לבית.
            </p>
          </div>
          <div className={`${styles.card} ${styles.photos}`}>
            {PHOTOS.map((photo) => (
              <img key={photo} className={styles.photo} src={photo} alt="" />
            ))}
          </div>
        </section>

        <section id="building" className={styles.section}>
          <h2 className={styles.sectionTitle}>מה אנחנו בונים?</h2>
          <p className={styles.statement}>
            <span lang="en">CAT-CH</span> היא אפליקציה שמאפשרת לתושבי השכונה
            לדאוג יחד לחתולי הרחוב באמצעות חלוקת משימות יומיות, כמו האכלה, מילוי
            מים ובדיקת מצבם הבריאותי.
          </p>
          <p className={styles.smallText}>
            האפליקציה מבוססת על ממשק החלקה בדומה לטינדר. כל כרטיס מציג חתול
            מהשכונה ומשימה שצריך לבצע עבורו. החלקה ימינה מאפשרת לקחת אחריות על
            המשימה ולשמור אותה למשך 30 דקות, והחלקה שמאלה מאפשרת לדלג עליה
            ולהשאיר אותה זמינה לשכנים אחרים.
          </p>
        </section>
      </div>
    </main>
  );
}
