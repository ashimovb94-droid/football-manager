from fastapi import APIRouter
router = APIRouter()

@router.get("/")
def get_season():
    return {"season": 1, "league": "championship"}
