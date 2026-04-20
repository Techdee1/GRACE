from fastapi import FastAPI

from app.api.router import api_router

app = FastAPI(title="GRACE Backend", version="0.1.0")

app.include_router(api_router)


@app.get("/health")
def health() -> dict[str, str]:
    # TODO: add API key gate before demo.
    return {"status": "ok"}
