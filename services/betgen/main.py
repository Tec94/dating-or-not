from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="Bet Generator", version="0.1.0")


class Message(BaseModel):
    text: str
    timestamp: Optional[str] = None


class UserProfile(BaseModel):
    id: str
    profile: dict = {}
    history: dict = {}


class ScoreRequest(BaseModel):
    matchId: str
    userA: Optional[UserProfile] = None
    userB: Optional[UserProfile] = None
    recentMessages: List[Message] = []
    consent: dict = {}
    trigger: Optional[str] = None


@app.post("/internal/betgen/score")
def score(req: ScoreRequest):
    # Very naive placeholder logic for MVP
    text_concat = " ".join([m.text.lower() for m in req.recentMessages])
    has_bar = "bar" in text_concat or "drink" in text_concat
    has_plan = any(k in text_concat for k in ["coffee", "meet", "see you", "at "])

    bets = [
        {
            "betType": "date_happens",
            "description": "Will the first date take place within 7 days?",
            "probability": 0.7 if has_plan else 0.5,
            "odds": round((1.0 / (0.7 if has_plan else 0.5)) * 0.95, 2),
            "confidence": 0.8 if has_plan else 0.6,
            "signals": ["explicit_plan"] if has_plan else ["baseline"],
        },
        {
            "betType": "drinks_over_2",
            "description": "Will they have 2 or more drinks?",
            "probability": 0.35 if has_bar else 0.25,
            "odds": round((1.0 / (0.35 if has_bar else 0.25)) * 0.95, 2),
            "confidence": 0.6,
            "signals": ["mention_of_bar"] if has_bar else ["baseline"],
        },
    ]

    return {"marketId": req.matchId, "bets": bets}


@app.get("/health")
def health():
    return {"ok": True}


