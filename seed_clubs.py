from app.database import SessionLocal
from app.models.club import Club

db = SessionLocal()

clubs = [
  # ЧЕМПИОНШИП
  {"id":1,  "name":"Coventry City",      "city":"Ковентри",       "league":"championship", "primary":"#59CBE8", "secondary":"#FFFFFF", "budget":8,  "rating":58, "min_rating":0, "goal":"Выход в АПЛ", "expectations":"Чемпионы Чемпионшипа — теперь в АПЛ"},
  {"id":2,  "name":"Ipswich Town",       "city":"Ипсвич",         "league":"championship", "primary":"#0044A9", "secondary":"#FFFFFF", "budget":38, "rating":65, "min_rating":0, "goal":"Снова в АПЛ", "expectations":"Вернуться после вылета"},
  {"id":3,  "name":"Millwall",           "city":"Лондон",         "league":"championship", "primary":"#001D5E", "secondary":"#FFFFFF", "budget":6,  "rating":55, "min_rating":0, "goal":"Плей-офф повышения", "expectations":"Боевой дух, физическая игра, результат"},
  {"id":4,  "name":"Southampton",        "city":"Саутгемптон",    "league":"championship", "primary":"#D71920", "secondary":"#FFFFFF", "budget":40, "rating":66, "min_rating":0, "goal":"Немедленное возвращение в АПЛ", "expectations":"Клуб не должен задерживаться в Чемпионшипе"},
  {"id":5,  "name":"Middlesbrough",      "city":"Мидлсбро",       "league":"championship", "primary":"#D71920", "secondary":"#FFFFFF", "budget":7,  "rating":55, "min_rating":0, "goal":"Плей-офф повышения", "expectations":"Агрессивный футбол, молодые таланты, топ-6"},
  {"id":6,  "name":"Hull City",          "city":"Халл",           "league":"championship", "primary":"#F18A00", "secondary":"#000000", "budget":5,  "rating":52, "min_rating":0, "goal":"Топ-6", "expectations":"Стабильная игра и результат"},
  {"id":7,  "name":"Wrexham",            "city":"Рексем",         "league":"championship", "primary":"#CC0000", "secondary":"#FFFFFF", "budget":6,  "rating":53, "min_rating":0, "goal":"Закрепиться в Чемпионшипе", "expectations":"Продолжить сенсационный подъём"},
  {"id":8,  "name":"Derby County",       "city":"Дерби",          "league":"championship", "primary":"#FFFFFF", "secondary":"#000000", "budget":5,  "rating":52, "min_rating":0, "goal":"Плей-офф", "expectations":"Возрождение после финансового кризиса"},
  {"id":9,  "name":"Norwich City",       "city":"Норвич",         "league":"championship", "primary":"#00A650", "secondary":"#FFF200", "budget":8,  "rating":56, "min_rating":0, "goal":"Выход в АПЛ", "expectations":"Комбинационный футбол, топ-2"},
  {"id":10, "name":"Birmingham City",    "city":"Бирмингем",      "league":"championship", "primary":"#0000FF", "secondary":"#FFFFFF", "budget":5,  "rating":51, "min_rating":0, "goal":"Середина таблицы", "expectations":"Стабилизация после хаоса"},
  {"id":11, "name":"Swansea City",       "city":"Суонси",         "league":"championship", "primary":"#FFFFFF", "secondary":"#000000", "budget":5,  "rating":52, "min_rating":0, "goal":"Топ-10", "expectations":"Контроль мяча, молодые игроки"},
  {"id":12, "name":"Bristol City",       "city":"Бристоль",       "league":"championship", "primary":"#E3001B", "secondary":"#FFFFFF", "budget":4,  "rating":50, "min_rating":0, "goal":"Выживание и прогресс", "expectations":"Бюджет скромный — нужна эффективность"},
  {"id":13, "name":"Sheffield United",   "city":"Шеффилд",        "league":"championship", "primary":"#EE2737", "secondary":"#000000", "budget":6,  "rating":54, "min_rating":0, "goal":"Возвращение в АПЛ", "expectations":"Быстрый отскок после вылета"},
  {"id":14, "name":"Preston North End",  "city":"Престон",        "league":"championship", "primary":"#FFFFFF", "secondary":"#000000", "budget":4,  "rating":50, "min_rating":0, "goal":"Середина таблицы", "expectations":"Стабильность и развитие молодёжи"},
  {"id":15, "name":"QPR",                "city":"Лондон",         "league":"championship", "primary":"#1D5BA4", "secondary":"#FFFFFF", "budget":5,  "rating":51, "min_rating":0, "goal":"Топ-6 и плей-офф", "expectations":"Лондонская гордость, нужны результаты"},
  {"id":16, "name":"Watford",            "city":"Уотфорд",        "league":"championship", "primary":"#FBEE23", "secondary":"#000000", "budget":9,  "rating":57, "min_rating":0, "goal":"Возвращение в АПЛ", "expectations":"Владелец вкладывает деньги — нужен результат"},
  {"id":17, "name":"Stoke City",         "city":"Сток",           "league":"championship", "primary":"#E03A3E", "secondary":"#FFFFFF", "budget":5,  "rating":51, "min_rating":0, "goal":"Середина таблицы", "expectations":"Стабильная игра без потрясений"},
  {"id":18, "name":"Portsmouth",         "city":"Портсмут",       "league":"championship", "primary":"#001489", "secondary":"#FFFFFF", "budget":4,  "rating":50, "min_rating":0, "goal":"Выживание", "expectations":"Закрепиться в Чемпионшипе"},
  {"id":19, "name":"Charlton Athletic",  "city":"Лондон",         "league":"championship", "primary":"#CC0000", "secondary":"#FFFFFF", "budget":4,  "rating":49, "min_rating":0, "goal":"Выживание", "expectations":"Стабилизация клуба"},
  {"id":20, "name":"Blackburn Rovers",   "city":"Блэкберн",       "league":"championship", "primary":"#009EE0", "secondary":"#FFFFFF", "budget":4,  "rating":50, "min_rating":0, "goal":"Середина таблицы", "expectations":"Постепенный прогресс"},
  {"id":21, "name":"West Brom",          "city":"Вест Бромвич",   "league":"championship", "primary":"#122F67", "secondary":"#FFFFFF", "budget":6,  "rating":53, "min_rating":0, "goal":"Плей-офф", "expectations":"Вернуться в АПЛ"},
  {"id":22, "name":"Oxford United",      "city":"Оксфорд",        "league":"championship", "primary":"#FFD700", "secondary":"#000000", "budget":3,  "rating":48, "min_rating":0, "goal":"Выживание", "expectations":"Первый сезон в Чемпионшипе — просто выжить"},
  {"id":23, "name":"Leicester City",     "city":"Лестер",         "league":"championship", "primary":"#003090", "secondary":"#FDBE11", "budget":55, "rating":71, "min_rating":0, "goal":"Выход в АПЛ", "expectations":"Немедленное возвращение в элиту"},
  {"id":24, "name":"Sheffield Wednesday","city":"Шеффилд",        "league":"championship", "primary":"#003082", "secondary":"#FFFFFF", "budget":3,  "rating":44, "min_rating":0, "goal":"Выживание", "expectations":"Катастрофический сезон — перестроиться"},
  # АПЛ
  {"id":101,"name":"Manchester City",    "city":"Манчестер",      "league":"epl", "primary":"#6CABDD", "secondary":"#FFFFFF", "budget":150,"rating":92,"min_rating":90,"goal":"Чемпионство АПЛ и Лига Чемпионов",   "expectations":"Только трофеи. Второе место — провал"},
  {"id":102,"name":"Arsenal",            "city":"Лондон",         "league":"epl", "primary":"#EF0107", "secondary":"#FFFFFF", "budget":120,"rating":89,"min_rating":85,"goal":"Чемпионство АПЛ",                     "expectations":"Болельщики ждут титул впервые за 20 лет"},
  {"id":103,"name":"Liverpool",          "city":"Ливерпуль",      "league":"epl", "primary":"#C8102E", "secondary":"#F6EB61", "budget":130,"rating":90,"min_rating":85,"goal":"Чемпионство и ЛЧ",                    "expectations":"Высокий прессинг, доминирование, трофеи"},
  {"id":104,"name":"Chelsea",            "city":"Лондон",         "league":"epl", "primary":"#034694", "secondary":"#FFFFFF", "budget":140,"rating":87,"min_rating":82,"goal":"Топ-4 и Кубок",                       "expectations":"Владелец нетерпелив — нужны трофеи быстро"},
  {"id":105,"name":"Manchester United",  "city":"Манчестер",      "league":"epl", "primary":"#DA020E", "secondary":"#FFE500", "budget":110,"rating":85,"min_rating":80,"goal":"Топ-4 и возврат величия",             "expectations":"Клуб в переходном периоде, нужна стабильность"},
  {"id":106,"name":"Tottenham",          "city":"Лондон",         "league":"epl", "primary":"#132257", "secondary":"#FFFFFF", "budget":100,"rating":84,"min_rating":78,"goal":"Топ-4 и трофей",                      "expectations":"Наконец-то выиграть что-то значимое"},
  {"id":107,"name":"Newcastle",          "city":"Ньюкасл",        "league":"epl", "primary":"#241F20", "secondary":"#FFFFFF", "budget":90, "rating":80,"min_rating":75,"goal":"Топ-4",                               "expectations":"Саудовские инвесторы хотят видеть прогресс"},
  {"id":108,"name":"Aston Villa",        "city":"Бирмингем",      "league":"epl", "primary":"#95BFE5", "secondary":"#670E36", "budget":85, "rating":79,"min_rating":75,"goal":"Топ-6 и Европа",                     "expectations":"Закрепиться среди элиты АПЛ"},
  {"id":109,"name":"Brighton",           "city":"Брайтон",        "league":"epl", "primary":"#0057B8", "secondary":"#FFFFFF", "budget":70, "rating":75,"min_rating":60,"goal":"Топ-8",                               "expectations":"Умный футбол, данные и аналитика"},
  {"id":110,"name":"West Ham",           "city":"Лондон",         "league":"epl", "primary":"#7A263A", "secondary":"#1BB1E7", "budget":65, "rating":73,"min_rating":60,"goal":"Топ-10",                              "expectations":"Стабильность и хороший футбол"},
  {"id":111,"name":"Fulham",             "city":"Лондон",         "league":"epl", "primary":"#FFFFFF", "secondary":"#000000", "budget":60, "rating":72,"min_rating":60,"goal":"Выживание с комфортом",               "expectations":"Остаться в АПЛ и развиваться"},
  {"id":112,"name":"Brentford",          "city":"Лондон",         "league":"epl", "primary":"#E30613", "secondary":"#FFFFFF", "budget":55, "rating":71,"min_rating":60,"goal":"Середина таблицы",                    "expectations":"Данные, эффективность, умные трансферы"},
  {"id":113,"name":"Crystal Palace",     "city":"Лондон",         "league":"epl", "primary":"#1B458F", "secondary":"#C4122E", "budget":50, "rating":70,"min_rating":60,"goal":"Топ-половина",                        "expectations":"Атакующий футбол, зрелищные матчи"},
  {"id":114,"name":"Everton",            "city":"Ливерпуль",      "league":"epl", "primary":"#003399", "secondary":"#FFFFFF", "budget":45, "rating":68,"min_rating":60,"goal":"Выживание",                           "expectations":"Клуб выходит из финансового кризиса"},
  {"id":115,"name":"Wolverhampton",      "city":"Вулвергемптон",  "league":"epl", "primary":"#FDB913", "secondary":"#231F20", "budget":50, "rating":69,"min_rating":60,"goal":"Топ-10",                              "expectations":"Стабильность после нестабильного периода"},
  {"id":116,"name":"Nottm Forest",       "city":"Ноттингем",      "league":"epl", "primary":"#DD0000", "secondary":"#FFFFFF", "budget":50, "rating":70,"min_rating":60,"goal":"Выживание и прогресс",                "expectations":"Продолжить возрождение клуба"},
  {"id":117,"name":"Bournemouth",        "city":"Борнмут",        "league":"epl", "primary":"#DA291C", "secondary":"#000000", "budget":45, "rating":68,"min_rating":60,"goal":"Выживание",                           "expectations":"Остаться в АПЛ любой ценой"},
  {"id":118,"name":"Sunderland",         "city":"Сандерленд",     "league":"epl", "primary":"#EB172B", "secondary":"#000000", "budget":35, "rating":62,"min_rating":60,"goal":"Выживание после повышения",           "expectations":"Болельщики счастливы — просто не вылететь"},
  {"id":119,"name":"Leeds United",       "city":"Лидс",           "league":"epl", "primary":"#1D428A", "secondary":"#FFFFFF", "budget":40, "rating":64,"min_rating":60,"goal":"Закрепиться в АПЛ",                  "expectations":"Наконец вернулись — теперь удержаться"},
  {"id":120,"name":"Burnley",            "city":"Бёрнли",         "league":"epl", "primary":"#6C1D45", "secondary":"#99D6EA", "budget":32, "rating":61,"min_rating":60,"goal":"Выживание",                           "expectations":"Бороться за каждое очко"},
]

for c in clubs:
    existing = db.query(Club).filter(Club.id == c["id"]).first()
    if not existing:
        db.add(Club(**c))

db.commit()
print(f"Done! {len(clubs)} clubs seeded.")
db.close()
