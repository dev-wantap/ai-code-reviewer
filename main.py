from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AI Code Reviewer", version="1.0.0")

app.mount("/static", StaticFiles(directory="static"), name="static")

class CodeReviewRequest(BaseModel):
    code: str

class CodeReviewResponse(BaseModel):
    review: str

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
)

@app.get("/")
async def root():
    return FileResponse("static/index.html")

@app.post("/review", response_model=CodeReviewResponse)
async def review_code(request: CodeReviewRequest):
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")
    
    try:
        prompt = f"""
You are an expert Python code reviewer. Please review the following Python code and provide structured feedback covering:

1. **Code Problems**: Any bugs, errors, or issues you find
2. **Good Practices**: What the code does well
3. **Improvements**: Specific suggestions for enhancement

Please format your response clearly with these sections.

Code to review:
```python
{request.code}
```
"""
        
        response = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-3.5-turbo"),
            messages=[
                {"role": "system", "content": "You are a helpful Python code reviewer."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000,
            temperature=0.3
        )
        
        review_content = response.choices[0].message.content
        return CodeReviewResponse(review=review_content)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing code review: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)