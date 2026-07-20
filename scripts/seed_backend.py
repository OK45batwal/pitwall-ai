from datetime import datetime, timezone

from app.db.session import Base, SessionLocal, engine
from app.models import Driver, Race, Team


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        mclaren = Team(name="McLaren", power_unit="Mercedes", base_color="#ff8700")
        red_bull = Team(name="Red Bull Racing", power_unit="Honda RBPT", base_color="#3671c6")
        ferrari = Team(name="Ferrari", power_unit="Ferrari", base_color="#e80020")
        db.add_all([mclaren, red_bull, ferrari])
        db.flush()
        db.add_all([
            Driver(code="NOR", name="Lando Norris", team_id=mclaren.id, rating=92),
            Driver(code="VER", name="Max Verstappen", team_id=red_bull.id, rating=94),
            Driver(code="LEC", name="Charles Leclerc", team_id=ferrari.id, rating=88),
        ])
        db.add(Race(season=2026, round=8, name="Monaco Grand Prix", circuit="Circuit de Monaco", start_time=datetime(2026, 5, 24, 13, 0, tzinfo=timezone.utc)))
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
