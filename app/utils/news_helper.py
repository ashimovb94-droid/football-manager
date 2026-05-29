from sqlalchemy import text

def create_news(db, club_id, news_type, title, body, icon='newspaper-outline'):
    try:
        db.execute(text(
            "INSERT INTO news (club_id, type, title, text, icon) "
            "VALUES (:club_id, :type, :title, :text, :icon)"
        ), {"club_id": club_id, "type": news_type, "title": title, "text": body, "icon": icon})
        db.commit()
    except Exception as e:
        print(f"News error: {e}")
