from app.database import SessionLocal
from app.models.bot_manager import BotManager
from app.models.club import Club
import random

db = SessionLocal()

BOT_NAMES = [
    ("Джон", "Смит", "🏴󠁧󠁢󠁥󠁮󠁧󠁿"),
    ("Карлос", "Мартинес", "🇪🇸"),
    ("Лука", "Росси", "🇮🇹"),
    ("Томас", "Мюллер", "🇩🇪"),
    ("Пьер", "Дюпон", "🇫🇷"),
    ("Йохан", "Ван Дер Берг", "🇳🇱"),
    ("Андрей", "Петров", "🇷🇺"),
    ("Марко", "Силва", "🇵🇹"),
    ("Джеймс", "Уилсон", "🏴󠁧󠁢󠁥󠁮󠁧󠁿"),
    ("Рафаэль", "Мендес", "🇧🇷"),
    ("Стивен", "Адамс", "🏴󠁧󠁢󠁳󠁣󠁴󠁿"),
    ("Патрик", "О'Брайен", "🇮🇪"),
    ("Хосе", "Гарсиа", "🇪🇸"),
    ("Франк", "Клеман", "🇧🇪"),
    ("Ян", "Новак", "🇵🇱"),
    ("Давид", "Коваль", "🇨🇿"),
    ("Микаэль", "Ларссон", "🇸🇪"),
    ("Нильс", "Хансен", "🇩🇰"),
    ("Кевин", "Мёрфи", "🏴󠁧󠁢󠁥󠁮󠁧󠁿"),
    ("Антонио", "Феррейра", "🇵🇹"),
    ("Бобби", "Тейлор", "🏴󠁧󠁢󠁥󠁮󠁧󠁿"),
    ("Алекс", "Краузе", "🇩🇪"),
    ("Луис", "Варела", "🇦🇷"),
    ("Сэм", "Хьюз", "🏴󠁧󠁢󠁷󠁬󠁳󠁿"),
    ("Макс", "Вагнер", "🇦🇹"),
    ("Том", "Бэйли", "🏴󠁧󠁢󠁥󠁮󠁧󠁿"),
    ("Рикардо", "Алвес", "🇵🇹"),
    ("Кристоф", "Мейер", "🇨🇭"),
    ("Шон", "Коннор", "🇮🇪"),
    ("Флориан", "Бернар", "🇫🇷"),
    ("Джорджо", "Конти", "🇮🇹"),
    ("Хамид", "Рашиди", "🇲🇦"),
    ("Эрик", "Петерсен", "🇩🇰"),
    ("Виктор", "Моро", "🇫🇷"),
    ("Деклан", "Бёрк", "🇮🇪"),
    ("Маттиас", "Хольм", "🇸🇪"),
    ("Симон", "Виллем", "🇧🇪"),
    ("Рубен", "Кастро", "🇪🇸"),
    ("Гарет", "Эванс", "🏴󠁧󠁢󠁷󠁬󠁳󠁿"),
    ("Андреас", "Штайн", "🇩🇪"),
    ("Дэниел", "Коул", "🏴󠁧󠁢󠁥󠁮󠁧󠁿"),
    ("Жоан", "Паоли", "🇫🇷"),
    ("Раул", "Гомес", "🇪🇸"),
    ("Ник", "Флетчер", "🏴󠁧󠁢󠁥󠁮󠁧󠁿"),
]

FORMATIONS = ['4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '3-4-3', '5-3-2']
STYLES = ['attacking', 'defensive', 'balanced', 'pressing', 'possession']
MENTALITIES = ['attack', 'balanced', 'defensive']
POLICIES = ['youth', 'experience', 'balanced']

clubs = db.query(Club).all()
existing = {b.club_id for b in db.query(BotManager).all()}

added = 0
for i, club in enumerate(clubs):
    if club.id in existing:
        continue
    first, last, nat = BOT_NAMES[i % len(BOT_NAMES)]
    bot = BotManager(
        club_id=club.id,
        name=f"{first} {last}",
        nationality=nat,
        rating=random.randint(45, 75),
        formation=random.choice(FORMATIONS),
        style=random.choice(STYLES),
        mentality=random.choice(MENTALITIES),
        transfer_policy=random.choice(POLICIES),
    )
    db.add(bot)
    added += 1

db.commit()
print(f"Done! {added} bot managers created.")
db.close()
