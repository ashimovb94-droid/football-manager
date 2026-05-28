from app.database import SessionLocal
from app.models.player import Player

db = SessionLocal()

players = [
  # ===== IPSWICH (id=2) =====
  {"id":3001,"name":"Christian","surname":"Walton","position":"GK","club_id":2,"age":28,"born":"1996-11-09","nationality":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Англия","overall":72,"potential":74,"salary":10,"value":2.5,"contract":2026,"fitness":100,"morale":8,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":3002,"name":"Luke","surname":"Woolfenden","position":"CB","club_id":2,"age":25,"born":"1998-12-21","nationality":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Англия","overall":70,"potential":74,"salary":8,"value":2.0,"contract":2026,"fitness":100,"morale":8,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":3003,"name":"Omari","surname":"Hutchinson","position":"RW","club_id":2,"age":20,"born":"2003-10-30","nationality":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Англия","overall":72,"potential":82,"salary":9,"value":5.0,"contract":2027,"fitness":100,"morale":9,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":3004,"name":"Sammie","surname":"Szmodics","position":"CAM","club_id":2,"age":28,"born":"1995-09-24","nationality":"🇮🇪 Ирландия","overall":73,"potential":74,"salary":11,"value":3.0,"contract":2026,"fitness":100,"morale":8,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":3005,"name":"Conor","surname":"Chaplin","position":"ST","club_id":2,"age":27,"born":"1997-02-14","nationality":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Англия","overall":71,"potential":73,"salary":9,"value":2.5,"contract":2026,"fitness":100,"morale":8,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},

  # ===== MILLWALL (id=3) =====
  {"id":3101,"name":"Liam","surname":"Roberts","position":"GK","club_id":3,"age":28,"born":"1996-01-28","nationality":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Англия","overall":70,"potential":71,"salary":7,"value":1.5,"contract":2025,"fitness":100,"morale":7,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":3102,"name":"Jake","surname":"Cooper","position":"CB","club_id":3,"age":29,"born":"1995-02-03","nationality":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Англия","overall":71,"potential":71,"salary":8,"value":1.5,"contract":2025,"fitness":100,"morale":7,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":3103,"name":"Zian","surname":"Flemming","position":"CAM","club_id":3,"age":24,"born":"1999-08-15","nationality":"🇳🇱 Нидерланды","overall":72,"potential":76,"salary":10,"value":3.0,"contract":2025,"fitness":100,"morale":8,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":3104,"name":"Romain","surname":"Esse","position":"CAM","club_id":3,"age":18,"born":"2005-04-12","nationality":"🇫🇷 Франция","overall":68,"potential":82,"salary":5,"value":2.0,"contract":2026,"fitness":100,"morale":9,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":3105,"name":"Kevin","surname":"Nisbet","position":"ST","club_id":3,"age":26,"born":"1998-03-08","nationality":"🏴󠁧󠁢󠁳󠁣󠁴󠁿 Шотландия","overall":71,"potential":73,"salary":9,"value":2.0,"contract":2026,"fitness":100,"morale":7,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},

  # ===== MIDDLESBROUGH (id=5) =====
  {"id":3201,"name":"Seny","surname":"Dieng","position":"GK","club_id":5,"age":31,"born":"1992-10-23","nationality":"🇸🇳 Сенегал","overall":72,"potential":72,"salary":9,"value":2.0,"contract":2025,"fitness":100,"morale":7,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":3202,"name":"Dael","surname":"Fry","position":"CB","club_id":5,"age":26,"born":"1997-08-30","nationality":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Англия","overall":71,"potential":73,"salary":8,"value":2.0,"contract":2026,"fitness":100,"morale":7,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":3203,"name":"Riley","surname":"McGree","position":"CM","club_id":5,"age":25,"born":"1998-11-02","nationality":"🇦🇺 Австралия","overall":72,"potential":75,"salary":10,"value":3.0,"contract":2026,"fitness":100,"morale":8,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":3204,"name":"Emmanuel","surname":"Latte Lath","position":"ST","club_id":5,"age":24,"born":"1999-12-24","nationality":"🇨🇮 Кот-д'Ивуар","overall":73,"potential":78,"salary":11,"value":4.0,"contract":2026,"fitness":100,"morale":8,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},

  # ===== NORWICH (id=9) =====
  {"id":3301,"name":"Angus","surname":"Gunn","position":"GK","club_id":9,"age":27,"born":"1996-01-22","nationality":"🏴󠁧󠁢󠁳󠁣󠁴󠁿 Шотландия","overall":73,"potential":75,"salary":10,"value":2.5,"contract":2026,"fitness":100,"morale":8,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":3302,"name":"Shane","surname":"Duffy","position":"CB","club_id":9,"age":31,"born":"1992-01-01","nationality":"🇮🇪 Ирландия","overall":71,"potential":71,"salary":9,"value":1.5,"contract":2025,"fitness":100,"morale":7,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":3303,"name":"Josh","surname":"Sargent","position":"ST","club_id":9,"age":23,"born":"2000-02-20","nationality":"🇺🇸 США","overall":72,"potential":77,"salary":11,"value":4.0,"contract":2026,"fitness":100,"morale":8,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":3304,"name":"Gabriel","surname":"Sara","position":"CM","club_id":9,"age":24,"born":"1999-09-08","nationality":"🇧🇷 Бразилия","overall":72,"potential":76,"salary":10,"value":3.5,"contract":2026,"fitness":100,"morale":8,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},

  # ===== WATFORD (id=16) =====
  {"id":3401,"name":"Daniel","surname":"Bachmann","position":"GK","club_id":16,"age":29,"born":"1994-07-09","nationality":"🇦🇹 Австрия","overall":72,"potential":73,"salary":10,"value":2.0,"contract":2025,"fitness":100,"morale":7,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":3402,"name":"Hassane","surname":"Kamara","position":"LB","club_id":16,"age":29,"born":"1994-12-26","nationality":"🇨🇮 Кот-д'Ивуар","overall":73,"potential":73,"salary":11,"value":3.0,"contract":2025,"fitness":100,"morale":7,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":3403,"name":"Vakoun","surname":"Bayo","position":"ST","club_id":16,"age":25,"born":"1998-01-10","nationality":"🇨🇮 Кот-д'Ивуар","overall":72,"potential":76,"salary":10,"value":3.0,"contract":2026,"fitness":100,"morale":8,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},

  # ===== LEICESTER (id=23) уже есть, добавим ещё =====
  {"id":3501,"name":"Stephy","surname":"Mavididi","position":"LW","club_id":23,"age":25,"born":"1999-05-31","nationality":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Англия","overall":74,"potential":77,"salary":15,"value":5.0,"contract":2026,"fitness":100,"morale":8,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":3502,"name":"Abdul","surname":"Fatawu","position":"RW","club_id":23,"age":20,"born":"2004-07-03","nationality":"🇬🇭 Гана","overall":73,"potential":82,"salary":12,"value":6.0,"contract":2027,"fitness":100,"morale":9,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
]

for p in players:
    existing = db.query(Player).filter(Player.id == p["id"]).first()
    if not existing:
        db.add(Player(**p))

db.commit()
print(f"Done! {len(players)} players seeded.")
db.close()
