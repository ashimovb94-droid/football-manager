from fastapi import APIRouter
router = APIRouter()

@router.get("/")
def get_transfers():
    return {"message": "Transfer market coming soon"}
