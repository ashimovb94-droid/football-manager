from app.database import SessionLocal
from app.models.player import Player

db = SessionLocal()

db.query(Player).filter(Player.club_id == 23).delete()
db.commit()

players = [
  # Вратари
  {"id":6101,"name":"Danny","surname":"Ward","position":"GK","club_id":23,"age":31,"born":"1993-06-22","nationality":"🏴󠁧󠁢󠁷󠁬󠁳󠁿 Уэльс","overall":72,"potential":72,"salary":10,"value":2.0,"contract":2026,"fitness":100,"morale":7,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6102,"name":"Daniel","surname":"Iversen","position":"GK","club_id":23,"age":27,"born":"1997-07-19","nationality":"🇩🇰 Дания","overall":70,"potential":73,"salary":7,"value":1.5,"contract":2026,"fitness":100,"morale":7,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  # Защитники
  {"id":6103,"name":"Wout","surname":"Faes","position":"CB","club_id":23,"age":26,"born":"1998-04-03","nationality":"🇧🇪 Бельгия","overall":76,"potential":79,"salary":18,"value":7.0,"contract":2027,"fitness":100,"morale":8,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6104,"name":"Conor","surname":"Coady","position":"CB","club_id":23,"age":31,"born":"1993-02-25","nationality":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Англия","overall":74,"potential":74,"salary":15,"value":3.0,"contract":2025,"fitness":100,"morale":7,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6105,"name":"Caleb","surname":"Okoli","position":"CB","club_id":23,"age":23,"born":"2001-03-14","nationality":"🇮🇹 Италия","overall":74,"potential":82,"salary":14,"value":5.5,"contract":2028,"fitness":100,"morale":8,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6106,"name":"Harry","surname":"Souttar","position":"CB","club_id":23,"age":26,"born":"1998-10-22","nationality":"🇦🇺 Австралия","overall":72,"potential":75,"salary":10,"value":3.0,"contract":2027,"fitness":100,"morale":7,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6107,"name":"Victor","surname":"Kristiansen","position":"LB","club_id":23,"age":22,"born":"2002-06-13","nationality":"🇩🇰 Дания","overall":74,"potential":82,"salary":14,"value":6.0,"contract":2028,"fitness":100,"morale":8,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6108,"name":"Ricardo","surname":"Pereira","position":"RB","club_id":23,"age":31,"born":"1993-10-06","nationality":"🇵🇹 Португалия","overall":74,"potential":74,"salary":15,"value":3.5,"contract":2025,"fitness":100,"morale":7,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6109,"name":"Luke","surname":"Thomas","position":"LB","club_id":23,"age":23,"born":"2001-06-10","nationality":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Англия","overall":70,"potential":76,"salary":9,"value":2.5,"contract":2026,"fitness":100,"morale":7,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  # Полузащитники
  {"id":6110,"name":"Harry","surname":"Winks","position":"CM","club_id":23,"age":28,"born":"1996-02-02","nationality":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Англия","overall":74,"potential":74,"salary":14,"value":4.0,"contract":2026,"fitness":100,"morale":7,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6111,"name":"Oliver","surname":"Skipp","position":"CDM","club_id":23,"age":24,"born":"2000-09-16","nationality":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Англия","overall":72,"potential":77,"salary":10,"value":3.5,"contract":2027,"fitness":100,"morale":7,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6112,"name":"Boubakary","surname":"Soumare","position":"CDM","club_id":23,"age":25,"born":"1999-02-27","nationality":"🇫🇷 Франция","overall":73,"potential":76,"salary":12,"value":4.0,"contract":2026,"fitness":100,"morale":7,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6113,"name":"Kasey","surname":"McAteer","position":"RM","club_id":23,"age":23,"born":"2001-05-14","nationality":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Англия","overall":69,"potential":75,"salary":7,"value":2.0,"contract":2026,"fitness":100,"morale":8,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  # Нападающие
  {"id":6114,"name":"Abdul","surname":"Fatawu","position":"RW","club_id":23,"age":20,"born":"2004-07-03","nationality":"🇬🇭 Гана","overall":73,"potential":82,"salary":12,"value":6.0,"contract":2027,"fitness":100,"morale":9,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6115,"name":"Stephy","surname":"Mavididi","position":"LW","club_id":23,"age":25,"born":"1998-05-31","nationality":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Англия","overall":74,"potential":77,"salary":15,"value":5.0,"contract":2026,"fitness":100,"morale":8,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6116,"name":"Patson","surname":"Daka","position":"ST","club_id":23,"age":26,"born":"1998-05-09","nationality":"🇿🇲 Замбия","overall":76,"potential":80,"salary":22,"value":9.0,"contract":2027,"fitness":100,"morale":8,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6117,"name":"Odsonne","surname":"Edouard","position":"ST","club_id":23,"age":27,"born":"1998-01-16","nationality":"🇫🇷 Франция","overall":73,"potential":74,"salary":14,"value":5.0,"contract":2026,"fitness":100,"morale":7,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6118,"name":"Jordan","surname":"Ayew","position":"ST","club_id":23,"age":33,"born":"1991-09-11","nationality":"🇬🇭 Гана","overall":70,"potential":70,"salary":10,"value":1.5,"contract":2025,"fitness":100,"morale":7,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
]

for p in players:
    db.add(Player(**p))

db.commit()
print(f"Done! {len(players)} players seeded for Leicester City.")
db.close()
