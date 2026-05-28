from app.database import SessionLocal
from app.models.player import Player

db = SessionLocal()

players = [
  # Вратари
  {"id":6001,"name":"Michael","surname":"Cooper","position":"GK","club_id":13,"age":25,"born":"1999-01-01","nationality":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Англия","overall":70,"potential":73,"salary":6,"value":1.5,"contract":2026,"fitness":100,"morale":7,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6002,"name":"Adam","surname":"Davies","position":"GK","club_id":13,"age":32,"born":"1992-01-01","nationality":"🏴󠁧󠁢󠁷󠁬󠁳󠁿 Уэльс","overall":68,"potential":68,"salary":5,"value":0.8,"contract":2025,"fitness":100,"morale":7,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  # Защитники
  {"id":6003,"name":"Jaheam","surname":"Tanganga","position":"RB","club_id":13,"age":25,"born":"1999-01-01","nationality":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Англия","overall":72,"potential":74,"salary":8,"value":2.5,"contract":2026,"fitness":100,"morale":7,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6004,"name":"Sam","surname":"McCallum","position":"LB","club_id":13,"age":24,"born":"2000-01-01","nationality":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Англия","overall":70,"potential":74,"salary":7,"value":2.0,"contract":2026,"fitness":100,"morale":7,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6005,"name":"Ben","surname":"Godfrey","position":"CB","club_id":13,"age":26,"born":"1998-01-01","nationality":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Англия","overall":73,"potential":75,"salary":9,"value":3.0,"contract":2026,"fitness":100,"morale":7,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6006,"name":"Harrison","surname":"Burrows","position":"LB","club_id":13,"age":22,"born":"2002-01-01","nationality":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Англия","overall":68,"potential":74,"salary":6,"value":1.5,"contract":2026,"fitness":100,"morale":7,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6007,"name":"Ben","surname":"Mee","position":"CB","club_id":13,"age":34,"born":"1989-01-01","nationality":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Англия","overall":70,"potential":70,"salary":7,"value":0.8,"contract":2025,"fitness":100,"morale":7,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6008,"name":"Jamie","surname":"Shackleton","position":"RB","club_id":13,"age":25,"born":"1999-01-01","nationality":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Англия","overall":68,"potential":70,"salary":5,"value":1.0,"contract":2025,"fitness":100,"morale":7,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6009,"name":"Mark","surname":"McGuinness","position":"CB","club_id":13,"age":23,"born":"2001-01-01","nationality":"🇮🇪 Ирландия","overall":67,"potential":72,"salary":5,"value":1.0,"contract":2026,"fitness":100,"morale":7,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  # Полузащитники
  {"id":6010,"name":"Ollie","surname":"Arblaster","position":"CM","club_id":13,"age":20,"born":"2004-01-01","nationality":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Англия","overall":70,"potential":80,"salary":6,"value":3.0,"contract":2027,"fitness":100,"morale":8,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6011,"name":"Gustavo","surname":"Hamer","position":"CM","club_id":13,"age":27,"born":"1997-01-01","nationality":"🇳🇱 Нидерланды","overall":74,"potential":76,"salary":12,"value":4.0,"contract":2026,"fitness":100,"morale":8,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6012,"name":"Callum","surname":"O'Hare","position":"CAM","club_id":13,"age":26,"born":"1998-01-01","nationality":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Англия","overall":73,"potential":75,"salary":10,"value":3.5,"contract":2026,"fitness":100,"morale":8,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6013,"name":"Chiedozie","surname":"Ogbene","position":"RM","club_id":13,"age":27,"born":"1997-01-01","nationality":"🇮🇪 Ирландия","overall":72,"potential":73,"salary":8,"value":2.5,"contract":2026,"fitness":100,"morale":7,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6014,"name":"Tom","surname":"Davies","position":"CDM","club_id":13,"age":26,"born":"1998-01-01","nationality":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Англия","overall":70,"potential":71,"salary":7,"value":2.0,"contract":2025,"fitness":100,"morale":7,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6015,"name":"Andre","surname":"Brooks","position":"CM","club_id":13,"age":21,"born":"2003-01-01","nationality":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Англия","overall":65,"potential":74,"salary":4,"value":1.0,"contract":2026,"fitness":100,"morale":8,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  # Нападающие
  {"id":6016,"name":"Rhian","surname":"Brewster","position":"ST","club_id":13,"age":24,"born":"2000-01-01","nationality":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Англия","overall":70,"potential":74,"salary":8,"value":2.5,"contract":2025,"fitness":100,"morale":7,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6017,"name":"Kieffer","surname":"Moore","position":"ST","club_id":13,"age":32,"born":"1992-01-01","nationality":"🏴󠁧󠁢󠁷󠁬󠁳󠁿 Уэльс","overall":71,"potential":71,"salary":8,"value":1.5,"contract":2025,"fitness":100,"morale":7,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6018,"name":"Tom","surname":"Cannon","position":"ST","club_id":13,"age":22,"born":"2002-01-01","nationality":"🇮🇪 Ирландия","overall":70,"potential":76,"salary":7,"value":2.5,"contract":2026,"fitness":100,"morale":8,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6019,"name":"Tyrese","surname":"Campbell","position":"ST","club_id":13,"age":25,"born":"1999-01-01","nationality":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Англия","overall":69,"potential":72,"salary":6,"value":1.5,"contract":2025,"fitness":100,"morale":7,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
]

# Удаляем старых игроков Шеффилд Юнайтед
db.query(Player).filter(Player.club_id == 13).delete()
db.commit()

for p in players:
    db.add(Player(**p))

db.commit()
print(f"Done! {len(players)} players seeded for Sheffield United.")
db.close()
