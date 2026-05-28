from app.database import SessionLocal
from app.models.player import Player

db = SessionLocal()
db.query(Player).filter(Player.club_id == 24).delete()
db.commit()

players = [
  # Вратари
  {"id":6201,"name":"Joe","surname":"Wildsmith","position":"GK","club_id":24,"age":29,"born":"1995-12-28","nationality":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Англия","overall":66,"potential":66,"salary":5,"value":0.5,"contract":2025,"fitness":100,"morale":5,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6202,"name":"Bailey","surname":"Peacock-Farrell","position":"GK","club_id":24,"age":28,"born":"1996-10-29","nationality":"🇬🇧 Сев.Ирландия","overall":65,"potential":65,"salary":4,"value":0.4,"contract":2025,"fitness":100,"morale":5,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  # Защитники
  {"id":6203,"name":"Liam","surname":"Palmer","position":"RB","club_id":24,"age":33,"born":"1991-09-19","nationality":"🏴󠁧󠁢󠁳󠁣󠁴󠁿 Шотландия","overall":65,"potential":65,"salary":4,"value":0.3,"contract":2025,"fitness":100,"morale":5,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6204,"name":"Dominic","surname":"Iorfa","position":"CB","club_id":24,"age":29,"born":"1995-06-24","nationality":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Англия","overall":66,"potential":66,"salary":5,"value":0.5,"contract":2025,"fitness":100,"morale":5,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6205,"name":"Chey","surname":"Dunkley","position":"CB","club_id":24,"age":32,"born":"1992-02-13","nationality":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Англия","overall":64,"potential":64,"salary":4,"value":0.3,"contract":2025,"fitness":100,"morale":5,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6206,"name":"Jayden","surname":"Brown","position":"LB","club_id":24,"age":25,"born":"1999-01-24","nationality":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Англия","overall":63,"potential":67,"salary":3,"value":0.5,"contract":2026,"fitness":100,"morale":5,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6207,"name":"Ciaran","surname":"Brennan","position":"CB","club_id":24,"age":24,"born":"2000-05-05","nationality":"🇮🇪 Ирландия","overall":62,"potential":67,"salary":3,"value":0.4,"contract":2025,"fitness":100,"morale":5,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  # Полузащитники
  {"id":6208,"name":"Barry","surname":"Bannan","position":"CM","club_id":24,"age":35,"born":"1989-12-01","nationality":"🏴󠁧󠁢󠁳󠁣󠁴󠁿 Шотландия","overall":68,"potential":68,"salary":6,"value":0.5,"contract":2025,"fitness":100,"morale":6,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6209,"name":"Dennis","surname":"Adeniran","position":"CM","club_id":24,"age":25,"born":"1999-01-02","nationality":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Англия","overall":65,"potential":69,"salary":4,"value":0.8,"contract":2026,"fitness":100,"morale":5,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6210,"name":"Fisayo","surname":"Dele-Bashiru","position":"CAM","club_id":24,"age":23,"born":"2001-02-06","nationality":"🇳🇬 Нигерия","overall":66,"potential":73,"salary":5,"value":1.0,"contract":2026,"fitness":100,"morale":6,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6211,"name":"Massimo","surname":"Luongo","position":"CDM","club_id":24,"age":32,"born":"1992-09-25","nationality":"🇦🇺 Австралия","overall":65,"potential":65,"salary":4,"value":0.3,"contract":2025,"fitness":100,"morale":5,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6212,"name":"George","surname":"Byers","position":"CM","club_id":24,"age":28,"born":"1996-05-29","nationality":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Англия","overall":64,"potential":64,"salary":3,"value":0.3,"contract":2025,"fitness":100,"morale":5,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  # Нападающие
  {"id":6213,"name":"Josh","surname":"Windass","position":"CAM","club_id":24,"age":30,"born":"1994-01-09","nationality":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Англия","overall":67,"potential":67,"salary":6,"value":0.8,"contract":2025,"fitness":100,"morale":5,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6214,"name":"Callum","surname":"Paterson","position":"ST","club_id":24,"age":30,"born":"1994-10-13","nationality":"🏴󠁧󠁢󠁳󠁣󠁴󠁿 Шотландия","overall":65,"potential":65,"salary":4,"value":0.4,"contract":2025,"fitness":100,"morale":5,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6215,"name":"Lee","surname":"Gregory","position":"ST","club_id":24,"age":36,"born":"1988-08-26","nationality":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Англия","overall":63,"potential":63,"salary":3,"value":0.2,"contract":2025,"fitness":100,"morale":5,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
  {"id":6216,"name":"Seydo","surname":"Berahino","position":"ST","club_id":24,"age":31,"born":"1993-08-04","nationality":"🇧🇮 Бурунди","overall":63,"potential":63,"salary":3,"value":0.2,"contract":2025,"fitness":100,"morale":5,"fatigue":0,"injury":None,"stats":{"matches":0,"goals":0,"assists":0,"yellow":0,"red":0,"rating":0.0},"form":[],"awards":[]},
]

for p in players:
    db.add(Player(**p))

db.commit()
print(f"Done! {len(players)} players seeded for Sheffield Wednesday.")
db.close()
