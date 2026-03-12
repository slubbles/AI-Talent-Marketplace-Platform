from fastapi import FastAPI


app = FastAPI(title="AI Talent Marketplace AI Engine")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "ai-engine"}
